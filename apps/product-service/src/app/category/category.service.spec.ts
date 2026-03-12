import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ProductPrismaService } from '../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeCategory = (overrides: Record<string, unknown> = {}) => ({
  id: 'cat-1',
  name: 'Electronics',
  slug: 'electronics',
  description: null,
  parentId: null,
  children: [] as unknown[],
  attributes: null,
  image: null,
  position: 0,
  isActive: true,
  parent: null,
  products: [] as unknown[],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  category: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  product: {
    count: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: ProductPrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(CategoryService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // Slug generation (tested indirectly through create)
  // -------------------------------------------------------------------------

  describe('slug generation', () => {
    it('generates a slug from the name when none is provided', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(makeCategory());

      await service.create({ name: 'Running Shoes', isActive: true } as never);

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'running-shoes' }),
        })
      );
    });

    it('lowercases, strips special chars, and collapses repeated hyphens', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(makeCategory());

      await service.create({ name: "Men's T--Shirts", isActive: true } as never);

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'mens-t-shirts' }),
        })
      );
    });

    it('uses the provided slug instead of generating one', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      mockPrisma.category.create.mockResolvedValue(makeCategory());

      await service.create({ name: 'Electronics', slug: 'custom-slug', isActive: true } as never);

      expect(mockPrisma.category.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'custom-slug' }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('throws ConflictException when a category with the same slug already exists', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeCategory());

      await expect(
        service.create({ name: 'Electronics', isActive: true } as never)
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.category.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when parentId references a non-existent category', async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(null) // slug check: no conflict
        .mockResolvedValueOnce(null); // parent check: not found

      await expect(
        service.create({ name: 'Laptops', parentId: 'non-existent', isActive: true } as never)
      ).rejects.toThrow(NotFoundException);
    });

    it('creates successfully when a valid parentId is provided', async () => {
      mockPrisma.category.findUnique
        .mockResolvedValueOnce(null) // slug check: no conflict
        .mockResolvedValueOnce(makeCategory({ id: 'parent-1' })); // parent exists
      mockPrisma.category.create.mockResolvedValue(
        makeCategory({ name: 'Laptops', parentId: 'parent-1' })
      );

      const result = await service.create({
        name: 'Laptops',
        parentId: 'parent-1',
        isActive: true,
      } as never);

      expect(result).toMatchObject({ name: 'Laptops', parentId: 'parent-1' });
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('throws NotFoundException when the category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when parentId equals the category own id (self-reference)', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeCategory({ id: 'cat-1' }));

      await expect(
        service.update('cat-1', { parentId: 'cat-1' })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when the new slug is already used by another category', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeCategory({ id: 'cat-1' }));
      mockPrisma.category.findFirst.mockResolvedValue(makeCategory({ id: 'cat-2', slug: 'electronics' }));

      await expect(
        service.update('cat-1', { slug: 'electronics' })
      ).rejects.toThrow(ConflictException);
    });

    it('auto-generates a new slug when name changes and no explicit slug is provided', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeCategory({ id: 'cat-1' }));
      mockPrisma.category.update.mockResolvedValue(
        makeCategory({ name: 'Mobile Phones', slug: 'mobile-phones' })
      );

      await service.update('cat-1', { name: 'Mobile Phones' });

      expect(mockPrisma.category.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'mobile-phones' }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('throws NotFoundException when the category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when the category has subcategories', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(
        makeCategory({ children: [makeCategory({ id: 'child-1' })] })
      );

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException when the category has associated products', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeCategory({ children: [] }));
      mockPrisma.product.count.mockResolvedValue(5);

      await expect(service.remove('cat-1')).rejects.toThrow(ConflictException);
      expect(mockPrisma.category.delete).not.toHaveBeenCalled();
    });

    it('deletes successfully when there are no children and no products', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(makeCategory({ children: [] }));
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.category.delete.mockResolvedValue(makeCategory());

      await service.remove('cat-1');

      expect(mockPrisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-1' } });
    });
  });
});
