import React, { useState } from 'react';
import '../../components/ReviewForm.css';

interface ReviewFormProps {
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ReviewForm({ onSubmit, onCancel, isLoading = false }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      setError('Vui lòng nhập bình luận');
      return;
    }

    if (comment.trim().length < 5) {
      setError('Bình luận phải tối thiểu 5 ký tự');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(rating, comment);
      // Reset form on success
      setRating(5);
      setComment('');
    } catch (err: any) {
      setError(err?.message || 'Có lỗi khi gửi đánh giá');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-form-wrapper">
      <form onSubmit={handleSubmit} className="review-form">
        {/* Header */}
        <div className="review-form-header">
          <h4>✨ Chia sẻ trải nghiệm của bạn</h4>
          <p className="review-form-subtitle">Đánh giá giúp salon cải tiến dịch vụ</p>
        </div>

        {/* Star Rating */}
        <div className="review-form-group">
          <label className="review-form-label">Đánh giá của bạn</label>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button ${
                  (hoveredStar || rating) >= star ? 'active' : ''
                }`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                title={`${star} sao`}
              >
                ⭐
              </button>
            ))}
          </div>
          <div className="star-label">
            {hoveredStar ? `${hoveredStar} sao` : `${rating} sao`}
          </div>
        </div>

        {/* Comment */}
        <div className="review-form-group">
          <label htmlFor="comment" className="review-form-label">
            Bình luận
          </label>
          <textarea
            id="comment"
            className="review-textarea"
            placeholder="Chia sẻ trải nghiệm của bạn về dịch vụ, stylist, không gian salon..."
            value={comment}
            onChange={(e) => {
              setComment(e.target.value);
              setError(null);
            }}
            rows={4}
            maxLength={500}
            disabled={submitting || isLoading}
          />
          <div className="comment-counter">
            {comment.length}/500
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="review-error">
            ⚠️ {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="review-form-actions">
          <button
            type="submit"
            className="btn-submit"
            disabled={submitting || isLoading}
          >
            {submitting ? '⏳ Đang gửi...' : '✓ Gửi đánh giá'}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={submitting || isLoading}
          >
            ✕ Hủy
          </button>
        </div>
      </form>
    </div>
  );
}
