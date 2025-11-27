import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/PaymentSuccess.css';

export type PaymentMethod = 'cash' | 'bank_transfer';

interface PaymentSuccessProps {
  bookingId: number;
  amount: number;
  method: PaymentMethod;
  onContinue?: () => void;
}

const PaymentSuccess: React.FC<PaymentSuccessProps> = ({
  bookingId,
  amount,
  method,
  onContinue
}) => {
  const navigate = useNavigate();
  const isBankTransfer = method === 'bank_transfer';

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    }
    // Navigate to payment history page
    navigate('/payments');
  };

  const getMethodLabel = () => {
    return isBankTransfer ? '🏦 Chuyển Khoản' : '💵 Tiền Mặt';
  };

  return (
    <div className="payment-success-overlay">
      <div className="payment-success-container">
        {/* Success Icon */}
        <div className="success-icon" />
        
        {/* Title & Subtitle */}
        <h2 className="success-title">Thanh Toán Thành Công!</h2>
        <p className="success-subtitle">
          Lịch hẹn của bạn đã được xác nhận thành công
        </p>

        {/* Booking Details Card */}
        <div className="success-details-card">
          <div className="detail-row">
            <span className="detail-label">Mã Lịch Hẹn</span>
            <span className="detail-value">#{bookingId}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Số Tiền</span>
            <span className="detail-value price">
              {amount.toLocaleString()}đ
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Phương Thức</span>
            <span className="detail-value">{getMethodLabel()}</span>
          </div>
        </div>

        {/* Bank Transfer Instructions */}
        {isBankTransfer && (
          <div className="bank-transfer-info">
            <h3>Hướng Dẫn Chuyển Khoản</h3>
            
            <div className="bank-details">
              <div className="bank-item">
                <span className="bank-label">Ngân Hàng</span>
                <span className="bank-value">MB Bank (MB)</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">Số Tài Khoản</span>
                <span className="bank-value">0199988899910</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">Chủ Tài Khoản</span>
                <span className="bank-value">Trương Văn Ý</span>
              </div>
              <div className="bank-item">
                <span className="bank-label">Số Tiền</span>
                <span className="bank-value">
                  {amount.toLocaleString()}đ
                </span>
              </div>
              <div className="bank-item">
                <span className="bank-label">Nội Dung</span>
                <span className="bank-value">BOOKING {bookingId}</span>
              </div>
            </div>
            
            <div className="bank-warning">
              Vui lòng chuyển đúng số tiền và nội dung để xác nhận thanh toán tự động.
            </div>
          </div>
        )}

        {/* Cash Payment Info */}
        {!isBankTransfer && (
          <div className="cash-info">
            <div className="info-box">
              <p>
                Bạn sẽ thanh toán bằng tiền mặt khi đến salon. 
                Vui lòng đến đúng giờ hẹn để được phục vụ tốt nhất!
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="success-next-steps">
          <h3>Các Bước Tiếp Theo</h3>
          <ol>
            <li>Kiểm tra email để nhận xác nhận đặt lịch chi tiết</li>
            <li>Lưu lại mã lịch hẹn #{bookingId} để dễ tra cứu</li>
            <li>Đến salon đúng giờ hẹn đã chọn</li>
            {isBankTransfer && (
              <li>Hoàn tất chuyển khoản theo thông tin bên trên</li>
            )}
            {!isBankTransfer && (
              <li>Chuẩn bị tiền mặt để thanh toán tại salon</li>
            )}
          </ol>
        </div>

        {/* Continue Button */}
        <button 
          className="btn-continue" 
          onClick={handleContinue}
        >
          ✓ Hoàn Tất
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;