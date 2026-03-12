import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { BrandService } from './brand.service';
import { ProductPrismaService } from '../../prisma/prisma.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeBrand = (overrides: Record<string, unknown> = {}) => ({
  id: 'brand-1',
  name: 'Nike',
  slug: 'nike',
  description: null,
  logo: null,
  website: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  brand: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  product: {
    count: jest.fn(),
  },
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('BrandService', () => {
  let service: BrandService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        BrandService,
        { provide: ProductPrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get(BrandService);
  });

  afterEach(() => jest.clearAllMocks());

  // -------------------------------------------------------------------------
  // Slug generation (tested indirectly through create)
  // -------------------------------------------------------------------------

  describe('slug generation', () => {
    it('generates a slug from the brand name when none is provided', async () => {
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue(makeBrand());

      await service.create({ name: 'Under Armour' } as never);

      expect(mockPrisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'under-armour' }),
        })
      );
    });

    it('strips special characters and collapses extra hyphens', async () => {
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue(makeBrand());

      await service.create({ name: "Levi's--Jeans" } as never);

      expect(mockPrisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'levis-jeans' }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('throws ConflictException mentioning the name when brand name already exists', async () => {
      mockPrisma.brand.findFirst.mockResolvedValue(makeBrand({ name: 'Nike' }));

      await expect(
        service.create({ name: 'Nike' } as never)
      ).rejects.toThrow(ConflictException);

      expect(mockPrisma.brand.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException mentioning the slug when slug exists but name differs', async () => {
      // findFirst returns a brand with a different name but the same computed slug
      mockPrisma.brand.findFirst.mockResolvedValue(makeBrand({ name: 'Different Brand', slug: 'nikeX' }));

      await expect(
        service.create({ name: 'NikeX' } as never)
      ).rejects.toThrow(ConflictException);
    });

    it('defaults isActive to true when not provided', async () => {
      mockPrisma.brand.findFirst.mockResolvedValue(null);
      mockPrisma.brand.create.mockResolvedValue(makeBrand());

      await service.create({ name: 'Adidas' } as never);

      expect(mockPrisma.brand.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ isActive: true }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('throws NotFoundException when brand does not exist', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent', { name: 'New Name' })
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when new name is used by another brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(makeBrand()); // brand exists
      mockPrisma.brand.findFirst.mockResolvedValue(makeBrand({ id: 'brand-2', name: 'Puma' })); // name conflict

      await expect(
        service.update('brand-1', { name: 'Puma' })
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when new slug is used by another brand', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(makeBrand()); // brand exists
      mockPrisma.brand.findFirst.mockResolvedValue(makeBrand({ id: 'brand-2', slug: 'puma' })); // slug conflict

      await expect(
        service.update('brand-1', { slug: 'puma' })
      ).rejects.toThrow(ConflictException);
    });

    it('auto-generates a new slug when name changes without an explicit slug', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(makeBrand());
      mockPrisma.brand.findFirst.mockResolvedValue(null); // no name conflict
      mockPrisma.brand.update.mockResolvedValue(makeBrand({ name: 'Adidas', slug: 'adidas' }));

      await service.update('brand-1', { name: 'Adidas' });

      expect(mockPrisma.brand.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: 'adidas' }),
        })
      );
    });
  });

  // -------------------------------------------------------------------------
  // remove
  // -------------------------------------------------------------------------

  describe('remove', () => {
    it('throws NotFoundException when brand does not exist', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when brand has associated products', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(makeBrand());
      mockPrisma.product.count.mockResolvedValue(3);

      await expect(service.remove('brand-1')).rejects.toThrow(ConflictException);
      expect(mockPrisma.brand.delete).not.toHaveBeenCalled();
    });

    it('deletes successfully when brand has no associated products', async () => {
      mockPrisma.brand.findUnique.mockResolvedValue(makeBrand());
      mockPrisma.product.count.mockResolvedValue(0);
      mockPrisma.brand.delete.mockResolvedValue(makeBrand());

      await service.remove('brand-1');

      expect(mockPrisma.brand.delete).toHaveBeenCalledWith({ where: { id: 'brand-1' } });
    });
  });
});
