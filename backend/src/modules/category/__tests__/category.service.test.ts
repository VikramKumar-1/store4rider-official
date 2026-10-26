import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import * as redis from '../../../core/cache/redis';
import { ValidationError, NotFoundError } from '../../../core/errors/AppError';

vi.mock('../category.repository');
vi.mock('../../../core/cache/redis');

describe('CategoryService — Comprehensive Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Category Tree & Submenu Hierarchy', () => {
    it('should build a nested tree from flat categories with child submenus', async () => {
      const mockCategories = [
        { _id: '1', name: 'Helmets', slug: 'helmets' },
        { _id: '2', name: 'Full Face Helmets', slug: 'full-face-helmets', parentId: '1' },
        { _id: '3', name: 'Riding Jackets', slug: 'riding-jackets' },
      ];
      
      vi.mocked(redis.getCache).mockResolvedValue(null);
      vi.mocked(CategoryRepository.findAll).mockResolvedValue(mockCategories as any);
      
      const tree = await CategoryService.getCategoryTree();
      
      expect(tree).toHaveLength(2);
      expect(tree[0].name).toBe('Helmets');
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children[0].name).toBe('Full Face Helmets');
      expect(tree[1].name).toBe('Riding Jackets');
      expect(tree[1].children).toHaveLength(0);
      
      expect(redis.setCache).toHaveBeenCalled();
    });

    it('should return cached tree if available in Redis', async () => {
      const mockTree = [{ id: '1', name: 'Cached', children: [] }];
      vi.mocked(redis.getCache).mockResolvedValue(mockTree);
      
      const tree = await CategoryService.getCategoryTree();
      
      expect(tree).toBe(mockTree);
      expect(CategoryRepository.findAll).not.toHaveBeenCalled();
    });

    it('should resolve custom heroCategoryIds into full category objects', async () => {
      const mockCategories = [
        { _id: 'root_helmets', name: 'Helmets', slug: 'helmets', heroCategoryIds: ['sub_ff', 'sub_mod'] },
        { _id: 'sub_ff', name: 'Full Face', slug: 'full-face', parentId: 'root_helmets', image: 'ff.webp' },
        { _id: 'sub_mod', name: 'Modular', slug: 'modular', parentId: 'root_helmets', image: 'mod.webp' },
        { _id: 'sub_open', name: 'Open Face', slug: 'open-face', parentId: 'root_helmets', image: 'open.webp' },
      ];

      vi.mocked(redis.getCache).mockResolvedValue(null);
      vi.mocked(CategoryRepository.findAll).mockResolvedValue(mockCategories as any);

      const tree = await CategoryService.getCategoryTree();
      expect(tree[0].heroCategories).toHaveLength(2);
      expect(tree[0].heroCategories[0].name).toBe('Full Face');
      expect(tree[0].heroCategories[1].name).toBe('Modular');
    });
  });

  describe('2. Slug Resolution & Aliases', () => {
    it('should resolve category by exact slug', async () => {
      const mockCat = { _id: '1', name: 'Helmets', slug: 'helmets' };
      vi.mocked(CategoryRepository.findBySlug).mockResolvedValue(mockCat as any);

      const result = await CategoryService.getCategoryBySlug('helmets');
      expect(result).toEqual(mockCat);
      expect(CategoryRepository.findBySlug).toHaveBeenCalledWith('helmets');
    });

    it('should resolve singular slug to plural slug (e.g. helmet -> helmets)', async () => {
      const mockCat = { _id: '1', name: 'Helmets', slug: 'helmets' };
      vi.mocked(CategoryRepository.findBySlug)
        .mockResolvedValueOnce(null) // first try: 'helmet'
        .mockResolvedValueOnce(mockCat as any); // second try: 'helmets'

      const result = await CategoryService.getCategoryBySlug('helmet');
      expect(result).toEqual(mockCat);
      expect(CategoryRepository.findBySlug).toHaveBeenCalledWith('helmets');
    });

    it('should strip .html extensions automatically', async () => {
      const mockCat = { _id: '1', name: 'Full Face', slug: 'full-face-helmets' };
      vi.mocked(CategoryRepository.findBySlug).mockResolvedValue(mockCat as any);

      await CategoryService.getCategoryBySlug('full-face-helmets.html');
      expect(CategoryRepository.findBySlug).toHaveBeenCalledWith('full-face-helmets');
    });
  });

  describe('3. Circular Hierarchy & Validation Guards', () => {
    it('should throw ValidationError if category is set as its own parent', async () => {
      await expect(
        CategoryService.updateCategory('cat_123', { parentId: 'cat_123' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError if descendant is set as parent (circular hierarchy)', async () => {
      const allMockCategories = [
        { _id: 'root_helmets', name: 'Helmets' },
        { _id: 'sub_ff', name: 'Full Face', parentId: 'root_helmets' },
        { _id: 'sub_carbon', name: 'Carbon Full Face', parentId: 'sub_ff' },
      ];
      vi.mocked(CategoryRepository.findAll).mockResolvedValue(allMockCategories as any);

      // Attempt to make "root_helmets" a child of its own grandchild "sub_carbon"
      await expect(
        CategoryService.updateCategory('root_helmets', { parentId: 'sub_carbon' })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('4. Orphan Subcategory Prevention on Delete', () => {
    it('should promote child subcategories to parent or root on category deletion', async () => {
      const parentCat = { _id: 'parent_1', name: 'Helmets', parentId: undefined };
      vi.mocked(CategoryRepository.findById).mockResolvedValue(parentCat as any);
      vi.mocked(CategoryRepository.updateMany).mockResolvedValue(undefined as any);
      vi.mocked(CategoryRepository.delete).mockResolvedValue(undefined as any);

      await CategoryService.deleteCategory('parent_1');

      // Direct children should be promoted to undefined (root)
      expect(CategoryRepository.updateMany).toHaveBeenCalledWith(
        { parentId: 'parent_1' },
        { parentId: undefined }
      );
      expect(CategoryRepository.delete).toHaveBeenCalledWith('parent_1');
      expect(redis.deleteCache).toHaveBeenCalledWith('category_tree_v2');
    });
  });

  describe('5. Slug Sanitization & Unique Collision Prevention', () => {
    it('should sanitize slugs and append timestamp if slug already exists', async () => {
      vi.mocked(CategoryRepository.findBySlug).mockResolvedValueOnce({ _id: 'existing', slug: 'gloves' } as any);
      vi.mocked(CategoryRepository.create).mockImplementation(async (data: any) => data);

      const created = await CategoryService.createCategory({ name: 'Gloves', slug: 'gloves' });
      expect(created.slug).toMatch(/^gloves-\d{4}$/);
      expect(CategoryRepository.create).toHaveBeenCalled();
    });
  });
});
