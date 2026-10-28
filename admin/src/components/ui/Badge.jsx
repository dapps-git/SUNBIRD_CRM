import React from 'react';

const getBadgeStyle = (status) => {
  switch (status) {
    case 'Work Approved':
    case 'Completed':
    case 'Fully Paid':
    case 'Verified':
    case 'Paid':
    case 'Accepted':
    case 'Converted to Client':
      return 'badge-green';

    case 'New Lead':
    case 'Approved':
    case 'Partially Paid':
    case 'Sent':
      return 'badge-blue';

    case 'Follow-Up':
    case 'Installation in Progress':
    case 'Pending':
    case 'Draft':
      return 'badge-amber';

    case 'Contacted':
    case 'Planning':
      return 'badge-purple';

    case 'Not Approved':
    case 'Failed':
    case 'Rejected':
      return 'badge-red';

    default:
      return 'badge-gray';
  }
};

const Badge = ({ status, text }) => {
  const styleClass = getBadgeStyle(status || text);
  return (
    <span className={`badge ${styleClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {text || status || 'N/A'}
    </span>
  );
};

export default Badge;
