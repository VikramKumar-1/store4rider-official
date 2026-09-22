import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CategoryService } from '../category.service';
import { CategoryRepository } from '../category.repository';
import * as redis from '../../../core/cache/redis';

vi.mock('../category.repository');
vi.mock('../../../core/cache/redis');

describe('CategoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build a nested tree from flat categories', async () => {
    const mockCategories = [
      { _id: '1', name: 'Helmets', slug: 'helmets' },
      { _id: '2', name: 'Full Face', slug: 'full-face', parentId: '1' },
      { _id: '3', name: 'Jackets', slug: 'jackets' },
    ];
    
    vi.mocked(redis.getCache).mockResolvedValue(null);
    vi.mocked(CategoryRepository.findAll).mockResolvedValue(mockCategories as any);
    
    const tree = await CategoryService.getCategoryTree();
    
    expect(tree).toHaveLength(2);
    expect(tree[0].name).toBe('Helmets');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('Full Face');
    expect(tree[1].name).toBe('Jackets');
    expect(tree[1].children).toHaveLength(0);
    
    expect(redis.setCache).toHaveBeenCalled();
  });

  it('should return cached tree if available', async () => {
    const mockTree = [{ id: '1', name: 'Cached', children: [] }];
    vi.mocked(redis.getCache).mockResolvedValue(mockTree);
    
    const tree = await CategoryService.getCategoryTree();
    
    expect(tree).toBe(mockTree);
    expect(CategoryRepository.findAll).not.toHaveBeenCalled();
  });

  it('should invalidate cache when category created', async () => {
    vi.mocked(CategoryRepository.create).mockResolvedValue({ id: '99', name: 'New' } as any);
    
    await CategoryService.createCategory({ name: 'New' });
    
    expect(CategoryRepository.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New', slug: 'new' }));
    expect(redis.deleteCache).toHaveBeenCalledWith('category_tree');
  });
});
