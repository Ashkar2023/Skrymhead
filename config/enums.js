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

const sort = {
  "A-Z":{ brand : 1 },
  "Z-A":{brand: -1},
  "H-L":{"variants.price":-1},
  "L-H":{"variants.price":1},
  "newest":{createdOn:-1}
}

const monthNames = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December"
];

module.exports = {
  payment,
  order,
  sort,
  monthNames
};

