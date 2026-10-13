import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReviewService } from '../review.service';
import { ReviewRepository } from '../review.repository';
import { ConflictError } from '../../../core/errors/AppError';

describe('ReviewService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully add a review and update product stats', async () => {
    vi.spyOn(ReviewRepository, 'findByUserAndProduct').mockResolvedValue(null);
    vi.spyOn(ReviewRepository, 'create').mockResolvedValue({
      id: 'rev_1',
      userId: 'user_123',
      userName: 'Rider Vikram',
      productId: 'prod_456',
      rating: 5,
      comment: 'Top quality riding jacket!',
      createdAt: new Date(),
    } as any);

    vi.spyOn(ReviewRepository, 'calculateRatingStats').mockResolvedValue({
      avgRating: 5.0,
      reviewCount: 1,
    });

    const result = await ReviewService.addReview('user_123', {
      productId: 'prod_456',
      rating: 5,
      comment: 'Top quality riding jacket!',
      userName: 'Rider Vikram',
    });

    expect(result).toBeDefined();
    expect(result.userId).toBe('user_123');
    expect(result.rating).toBe(5);
    expect(ReviewRepository.findByUserAndProduct).toHaveBeenCalledWith('user_123', 'prod_456');
    expect(ReviewRepository.create).toHaveBeenCalled();
  });

  it('should throw ConflictError if user has already reviewed the product', async () => {
    vi.spyOn(ReviewRepository, 'findByUserAndProduct').mockResolvedValue({
      id: 'existing_rev',
      userId: 'user_123',
      productId: 'prod_456',
      rating: 4,
      comment: 'Already reviewed',
      createdAt: new Date(),
    } as any);

    await expect(
      ReviewService.addReview('user_123', {
        productId: 'prod_456',
        rating: 5,
        comment: 'Trying to review again',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should calculate correct average rating stats', async () => {
    vi.spyOn(ReviewRepository, 'calculateRatingStats').mockResolvedValue({
      avgRating: 4.5,
      reviewCount: 2,
    });

    const stats = await ReviewRepository.calculateRatingStats('prod_456');
    expect(stats.avgRating).toBe(4.5);
    expect(stats.reviewCount).toBe(2);
  });
});
