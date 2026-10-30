export function toQuery(filters) {
  return Object.entries(filters).reduce((query, [key, value]) => {
    if (value === '' || value === null || value === undefined) return query;
    query[key] = key === 'from' || key === 'to' ? new Date(value).toISOString() : value;
    return query;
  }, {});
}

export function isRangeInvalid(from, to) {
  if (!from || !to) return false;
  return new Date(from).getTime() >= new Date(to).getTime();
}
