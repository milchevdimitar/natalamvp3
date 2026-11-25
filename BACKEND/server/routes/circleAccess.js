const has = (list, id) => (list || []).some((value) => String(value) === String(id));

function canViewFriendship(account, other) {
  return Boolean(other && other.isActive !== false
    && has(account.friends, other._id) && has(other.friends, account._id)
    && !has(account.blockedUsers, other._id) && !has(other.blockedUsers, account._id));
}

module.exports = { canViewFriendship };
