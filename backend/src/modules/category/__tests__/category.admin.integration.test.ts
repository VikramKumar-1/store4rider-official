import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { adminRouter } from "../../admin/admin.route";
import { CategoryService } from "../category.service";
import { CategoryRepository } from "../category.repository";
import { UserService } from "../../user/user.service";
import * as jwtUtils from "../../../core/utils/jwt";
import * as redis from "../../../core/cache/redis";
import { UnauthorizedError, ForbiddenError, ValidationError } from "../../../core/errors/AppError";

vi.mock("../category.repository");
vi.mock("../../../core/cache/redis");
vi.mock("../../user/user.service");
vi.mock("../../../core/utils/jwt");

describe("Admin Category & Submenu Persistence — End-to-End Vitest Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setupAdminAuth = () => {
    vi.spyOn(jwtUtils, "verifyToken").mockReturnValue({ userId: "admin_user_001" } as any);
    vi.spyOn(UserService, "getRole").mockResolvedValue("admin");
  };

  const setupCustomerAuth = () => {
    vi.spyOn(jwtUtils, "verifyToken").mockReturnValue({ userId: "customer_user_999" } as any);
    vi.spyOn(UserService, "getRole").mockResolvedValue("customer");
  };

  describe("1. Security & Route Authentication (/admin/categories)", () => {
    it("SECURITY: rejects unauthenticated category update with 401 Unauthorized", async () => {
      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/cat_123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
      });

      await expect(adminRouter(req, ["categories", "cat_123"])).rejects.toThrow(UnauthorizedError);
    });

    it("SECURITY: rejects customer role with 403 Forbidden on category update", async () => {
      setupCustomerAuth();
      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/cat_123", {
        method: "PUT",
        headers: { authorization: "Bearer customer_jwt_token" },
        body: JSON.stringify({ name: "Hacked Category" }),
      });

      await expect(adminRouter(req, ["categories", "cat_123"])).rejects.toThrow(ForbiddenError);
    });

    it("SECURITY: rejects customer role on category creation", async () => {
      setupCustomerAuth();
      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories", {
        method: "POST",
        headers: { authorization: "Bearer customer_jwt_token" },
        body: JSON.stringify({ name: "Illegal Category" }),
      });

      await expect(adminRouter(req, ["categories"])).rejects.toThrow(ForbiddenError);
    });
  });

  describe("2. Saving Category Details & Rich Descriptions (PUT /admin/categories/:id)", () => {
    it("persists category details including rich HTML descriptions and FAQs", async () => {
      setupAdminAuth();

      const updatePayload = {
        name: "Full Face Helmets",
        slug: "full-face-helmets",
        description: `<h2>Premium Protection</h2><p>Top rated helmets for motorsport riders.</p><div class="w-full overflow-x-auto"><table class="min-w-full"><thead><tr><th>Model</th><th>Rating</th></tr></thead><tbody><tr><td>ECE 22.06</td><td>5 Star</td></tr></tbody></table></div>`,
        faqs: [
          {
            question: "Are these helmets ECE 22.06 certified?",
            answer: "Yes, all models in this series meet or exceed ECE 22.06 safety regulations.",
          },
          {
            question: "Can I replace the visor with a tinted one?",
            answer: "Yes, compatible smoke and mirror visors are available in our accessories section.",
          },
        ],
        metaTitle: "Buy Full Face Motorcycle Helmets Online in India",
        metaDescription: "Explore our collection of ECE and DOT approved full face motorcycle helmets.",
        metaKeywords: "helmets, full face, ece 22.06, riding gear",
        badge: "Bestseller",
        badgeColor: "bg-emerald-600",
        taxClassName: "Taxable Goods (GST 18%)",
        hsnCode: "6506",
        weightUnit: "kg",
        specDefinitions: [
          {
            key: "shell_material",
            label: "Shell Material",
            placeholder: "e.g. Carbon Fiber / Polycarbonate",
            presets: ["100% Carbon Fiber", "Tri-Composite", "Advanced Polycarbonate"],
          },
          {
            key: "certification",
            label: "Safety Certification",
            placeholder: "e.g. ECE 22.06 & DOT",
            presets: ["ECE 22.06 & DOT & ISI", "DOT & ISI", "Snell M2020"],
          },
        ],
      };

      const mockUpdatedCategory = {
        _id: "cat_full_face_01",
        ...updatePayload,
      };

      vi.mocked(CategoryRepository.update).mockResolvedValue(mockUpdatedCategory as any);

      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/cat_full_face_01", {
        method: "PUT",
        headers: { authorization: "Bearer admin_jwt_token" },
        body: JSON.stringify(updatePayload),
      });

      const response = await adminRouter(req, ["categories", "cat_full_face_01"]);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);

      const json = await response!.json();
      expect(json.success).toBe(true);
      expect(json.message).toBe("Category updated successfully");
      expect(json.data.name).toBe("Full Face Helmets");
      expect(json.data.faqs).toHaveLength(2);
      expect(json.data.description).toContain("<table");
      expect(json.data.hsnCode).toBe("6506");
      expect(json.data.specDefinitions).toHaveLength(2);
      expect(json.data.specDefinitions[0].presets).toContain("100% Carbon Fiber");

      // Verify DB repository was called with correct sanitized payload
      expect(CategoryRepository.update).toHaveBeenCalledWith("cat_full_face_01", expect.objectContaining({
        name: "Full Face Helmets",
        metaTitle: "Buy Full Face Motorcycle Helmets Online in India",
        taxClassName: "Taxable Goods (GST 18%)",
        specDefinitions: expect.arrayContaining([
          expect.objectContaining({ key: "shell_material", label: "Shell Material" }),
        ]),
      }));

      // Verify cache invalidation was triggered immediately
      expect(redis.deleteCache).toHaveBeenCalledWith("category_tree_v2");
    });
  });

  describe("3. Submenu & Hierarchy Re-parenting", () => {
    it("successfully moves a subcategory under a parent category", async () => {
      setupAdminAuth();

      const subcatPayload = {
        name: "Carbon Fiber Helmets",
        parentId: "parent_helmets_99",
        includeInMenu: true,
      };

      vi.mocked(CategoryRepository.findAll).mockResolvedValue([
        { _id: "parent_helmets_99", name: "Helmets" },
        { _id: "subcat_carbon", name: "Carbon Fiber Helmets", parentId: undefined },
      ] as any);

      vi.mocked(CategoryRepository.update).mockResolvedValue({
        _id: "subcat_carbon",
        ...subcatPayload,
      } as any);

      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/subcat_carbon", {
        method: "PUT",
        headers: { authorization: "Bearer admin_jwt_token" },
        body: JSON.stringify(subcatPayload),
      });

      const response = await adminRouter(req, ["categories", "subcat_carbon"]);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);

      expect(CategoryRepository.update).toHaveBeenCalledWith("subcat_carbon", expect.objectContaining({
        parentId: "parent_helmets_99",
      }));
      expect(redis.deleteCache).toHaveBeenCalledWith("category_tree_v2");
    });

    it("successfully promotes a subcategory to root level (removes parentId)", async () => {
      setupAdminAuth();

      const payload = {
        name: "Luggage & Bags",
        parentId: "",
      };

      vi.mocked(CategoryRepository.update).mockResolvedValue({
        _id: "cat_luggage",
        name: "Luggage & Bags",
        parentId: undefined,
      } as any);

      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/cat_luggage", {
        method: "PUT",
        headers: { authorization: "Bearer admin_jwt_token" },
        body: JSON.stringify(payload),
      });

      const response = await adminRouter(req, ["categories", "cat_luggage"]);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);

      const json = await response!.json();
      expect(json.success).toBe(true);
      expect(CategoryRepository.update).toHaveBeenCalledWith("cat_luggage", expect.objectContaining({
        parentId: undefined,
      }));
    });

    it("EDGE CASE: rejects circular parenting when category is assigned to itself", async () => {
      setupAdminAuth();

      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/cat_same_id", {
        method: "PUT",
        headers: { authorization: "Bearer admin_jwt_token" },
        body: JSON.stringify({
          name: "Broken Category",
          parentId: "cat_same_id",
        }),
      });

      await expect(adminRouter(req, ["categories", "cat_same_id"])).rejects.toThrow(ValidationError);
      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });

    it("EDGE CASE: rejects circular parenting when a parent is assigned to its own grandchild", async () => {
      setupAdminAuth();

      vi.mocked(CategoryRepository.findAll).mockResolvedValue([
        { _id: "root_gear", name: "Riding Gear" },
        { _id: "child_jackets", name: "Jackets", parentId: "root_gear" },
        { _id: "grandchild_leather", name: "Leather Jackets", parentId: "child_jackets" },
      ] as any);

      // Attempting to set root_gear's parent to grandchild_leather
      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/root_gear", {
        method: "PUT",
        headers: { authorization: "Bearer admin_jwt_token" },
        body: JSON.stringify({
          name: "Riding Gear",
          parentId: "grandchild_leather",
        }),
      });

      await expect(adminRouter(req, ["categories", "root_gear"])).rejects.toThrow(ValidationError);
      expect(CategoryRepository.update).not.toHaveBeenCalled();
    });
  });

  describe("4. Creating Categories & Submenus (POST /admin/categories)", () => {
    it("creates a new subcategory with heroCategoryIds, badge, and sizeChart", async () => {
      setupAdminAuth();

      const newCategoryData = {
        name: "Touring Boots",
        slug: "touring-boots",
        parentId: "cat_boots_root",
        description: "<p>Waterproof adventure touring boots with TPU shin protectors.</p>",
        badge: "Hot",
        badgeColor: "bg-amber-500",
        sizeChart: "https://s3.ap-south-2.amazonaws.com/store4riders/sizecharts/boots.png",
        heroCategoryIds: ["sub_adventure", "sub_waterproof"],
        taxClassName: "Taxable Goods (GST 18%)",
        hsnCode: "6403",
        weightUnit: "kg" as const,
        includeInMenu: true,
      };

      vi.mocked(CategoryRepository.findBySlug).mockResolvedValue(null);
      vi.mocked(CategoryRepository.create).mockImplementation(async (data: any) => ({
        _id: "new_boot_id_101",
        ...data,
      }));

      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories", {
        method: "POST",
        headers: { authorization: "Bearer admin_jwt_token" },
        body: JSON.stringify(newCategoryData),
      });

      const response = await adminRouter(req, ["categories"]);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(201);

      const json = await response!.json();
      expect(json.success).toBe(true);
      expect(json.data._id).toBe("new_boot_id_101");
      expect(json.data.name).toBe("Touring Boots");
      expect(json.data.heroCategoryIds).toEqual(["sub_adventure", "sub_waterproof"]);

      expect(CategoryRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        name: "Touring Boots",
        slug: "touring-boots",
        parentId: "cat_boots_root",
        badge: "Hot",
      }));
      expect(redis.deleteCache).toHaveBeenCalledWith("category_tree_v2");
    });
  });

  describe("5. Deleting Categories & Orphan Protection (DELETE /admin/categories/:id)", () => {
    it("safely deletes a category and promotes child subcategories so they never get lost", async () => {
      setupAdminAuth();

      const targetCategory = {
        _id: "parent_jackets_del",
        name: "Motorcycle Jackets",
        parentId: undefined,
      };

      vi.mocked(CategoryRepository.findById).mockResolvedValue(targetCategory as any);
      vi.mocked(CategoryRepository.updateMany).mockResolvedValue(undefined as any);
      vi.mocked(CategoryRepository.delete).mockResolvedValue(undefined as any);

      const req = new NextRequest("http://localhost:4000/api/v1/admin/categories/parent_jackets_del", {
        method: "DELETE",
        headers: { authorization: "Bearer admin_jwt_token" },
      });

      const response = await adminRouter(req, ["categories", "parent_jackets_del"]);
      expect(response).not.toBeNull();
      expect(response!.status).toBe(200);

      const json = await response!.json();
      expect(json.success).toBe(true);

      // Verify children were reparented to avoid orphan submenus
      expect(CategoryRepository.updateMany).toHaveBeenCalledWith(
        { parentId: "parent_jackets_del" },
        { parentId: undefined }
      );
      expect(CategoryRepository.delete).toHaveBeenCalledWith("parent_jackets_del");
      expect(redis.deleteCache).toHaveBeenCalledWith("category_tree_v2");
    });
  });
});
