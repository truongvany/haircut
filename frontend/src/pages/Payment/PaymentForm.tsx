import React, { useState } from 'react';
import '../../components/PaymentForm.css';

export type PaymentMethod = 'cash' | 'bank_transfer';

interface PaymentFormProps {
  amount: number;
  bookingId: number;
  onSubmit: (method: PaymentMethod) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  bookingId,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setIsProcessing(true);
    try {
      await onSubmit(method);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="payment-form-overlay">
      <div className="payment-form-container">
        <div className="payment-form-header">
          <h2>💳 Chọn Phương Thức Thanh Toán</h2>
          <p>Mã lịch: #{bookingId}</p>
        </div>

        <div className="payment-amount-card">
          <span className="amount-label">Số tiền cần thanh toán:</span>
          <span className="amount-value">{amount.toLocaleString()}đ</span>
        </div>

        <div className="payment-methods">
          {/* Cash Payment */}
          <div
            className={`payment-method-card ${selectedMethod === 'cash' ? 'selected' : ''}`}
            onClick={() => !isProcessing && setSelectedMethod('cash')}
          >
            <div className="method-radio">
              <input
                type="radio"
                id="cash"
                name="payment-method"
                value="cash"
                checked={selectedMethod === 'cash'}
                onChange={() => setSelectedMethod('cash')}
                disabled={isProcessing}
              />
              <label htmlFor="cash"></label>
            </div>
            <div className="method-content">
              <div className="method-icon">💵</div>
              <div className="method-info">
                <h3>Thanh Toán Tiền Mặt</h3>
                <p className="method-description">Thanh toán khi đến salon</p>
                <ul className="method-benefits">
                  <li>✓ Không cần thẻ tín dụng</li>
                  <li>✓ Linh hoạt, có thể thay đổi</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div
            className={`payment-method-card ${selectedMethod === 'bank_transfer' ? 'selected' : ''}`}
            onClick={() => !isProcessing && setSelectedMethod('bank_transfer')}
          >
            <div className="method-radio">
              <input
                type="radio"
                id="bank_transfer"
                name="payment-method"
                value="bank_transfer"
                checked={selectedMethod === 'bank_transfer'}
                onChange={() => setSelectedMethod('bank_transfer')}
                disabled={isProcessing}
              />
              <label htmlFor="bank_transfer"></label>
            </div>
            <div className="method-content">
              <div className="method-icon">🏦</div>
              <div className="method-info">
                <h3>Chuyển Khoản Ngân Hàng</h3>
                <p className="method-description">Chuyển trước và nhận xác nhận</p>
                <ul className="method-benefits">
                  <li>✓ An toàn và bảo mật</li>
                  <li>✓ Xác nhận ngay lập tức</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="payment-form-actions">
          <button
            className="btn-cancel"
            onClick={onCancel}
            disabled={isProcessing || isLoading}
          >
            ✕ Hủy
          </button>
          <button
            className="btn-submit"
            onClick={() => selectedMethod && handleSubmit(selectedMethod)}
            disabled={!selectedMethod || isProcessing || isLoading}
          >
            {isProcessing || isLoading ? (
              <>
                <span className="spinner"></span> Đang xử lý...
              </>
            ) : (
              <>✓ Xác Nhận Thanh Toán</>
            )}
          </button>
        </div>

        <div className="payment-info-note">
          <p>💡 <strong>Lưu ý:</strong> Sau khi chọn phương thức thanh toán, bạn sẽ nhận được hướng dẫn chi tiết.</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;
