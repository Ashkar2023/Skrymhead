const payment = {
  PENDING: 'Pending',
  PAID: 'Paid',
  FAILED: 'Failed',
};

const order = {
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  RETURNED:"Returned",
  CANCELLED:"Cancelled",
  CBA:"Cancelled by Admin"
};

module.exports = {
  payment,
  order
};

