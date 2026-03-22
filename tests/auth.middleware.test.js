const jwt = require('jsonwebtoken');
const { authenticate, authenticateInternal } = require('../src/middleware/auth.middleware');

jest.mock('jsonwebtoken');

describe('auth middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.INTERNAL_API_KEY = 'internal-key';
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('authenticate rejects when token is missing', () => {
    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('authenticate allows valid token', () => {
    req.headers.authorization = 'Bearer good-token';
    jwt.verify.mockReturnValue({ id: 'user-1' });

    authenticate(req, res, next);

    expect(req.user).toEqual({ id: 'user-1' });
    expect(next).toHaveBeenCalled();
  });

  it('authenticate rejects expired token', () => {
    req.headers.authorization = 'Bearer expired-token';
    const err = new Error('expired');
    err.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => {
      throw err;
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Token has expired.' });
  });

  it('authenticate rejects invalid token', () => {
    req.headers.authorization = 'Bearer bad-token';
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });

    authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid token.' });
  });

  it('authenticateInternal rejects missing key', () => {
    authenticateInternal(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Forbidden.' });
  });

  it('authenticateInternal allows valid key', () => {
    req.headers['x-internal-key'] = 'internal-key';

    authenticateInternal(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
