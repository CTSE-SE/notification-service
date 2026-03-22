const errorHandler = require("../src/middleware/errorHandler.middleware");

describe("errorHandler middleware", () => {
  let req;
  let res;

  beforeEach(() => {
    req = { url: "/test", method: "GET" };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("handles SequelizeValidationError", () => {
    const err = {
      name: "SequelizeValidationError",
      errors: [{ message: "Invalid email" }],
    };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Validation error",
      errors: ["Invalid email"],
    });
  });

  it("handles SequelizeUniqueConstraintError", () => {
    const err = { name: "SequelizeUniqueConstraintError" };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Duplicate entry.",
    });
  });

  it("handles custom status errors", () => {
    const err = { statusCode: 404, message: "Not found" };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Not found",
    });
  });

  it("handles unknown errors as 500", () => {
    const err = { message: "Unexpected" };

    errorHandler(err, req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Internal server error.",
    });
  });
});
