/**
 * Turns axios/FastAPI errors into a user-visible string.
 * FastAPI may return `detail` as a string or a validation array.
 */
export function formatApiError(error, fallback = 'Something went wrong') {
  if (!error) return fallback;

  const detail = error.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const parts = detail
      .map((item) => (typeof item === 'object' && item?.msg ? item.msg : String(item)))
      .filter(Boolean);
    if (parts.length) return parts.join(' ');
  }

  if (detail && typeof detail === 'object' && typeof detail.msg === 'string') {
    return detail.msg;
  }

  const status = error.response?.status;
  if (
    error.message === 'Network Error' ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ECONNABORTED'
  ) {
    return "Can't reach the server. If you're on free hosting, wait ~1 minute and try again (the app may be waking up), or check your connection.";
  }
  if (status === 503 || status === 502 || status === 504) {
    return 'Server is temporarily unavailable. Please try again shortly.';
  }
  if (status === 500) {
    return 'Server error. Please try again or contact support if it keeps happening.';
  }

  if (error.message && !error.message.startsWith('Request failed')) {
    return error.message;
  }

  return fallback;
}
