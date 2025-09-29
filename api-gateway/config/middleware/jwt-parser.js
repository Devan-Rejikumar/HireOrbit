const jwt = require('jsonwebtoken');

module.exports = {
  name: 'jwt-parser',
  policy: (actionParams) => {
    return (req, res, next) => {
      try {
        // Get token from cookies
        const token = req.cookies && req.cookies.accessToken;
        
        if (!token) {
          console.log('🔍 [JWT-PARSER] No token found in cookies');
          return res.status(401).json({ error: 'No token provided' });
        }

        // Verify and decode the JWT token
        const decoded = jwt.verify(token, 'supersecret');
        
        console.log('🔍 [JWT-PARSER] Token decoded successfully:', {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        });

        // Add user info to request headers
        req.headers['x-user-id'] = decoded.userId;
        req.headers['x-user-email'] = decoded.email;
        req.headers['x-user-role'] = decoded.role;

        // Add user info to request object for debugging
        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };

        next();
      } catch (error) {
        console.log('🔍 [JWT-PARSER] Token verification failed:', error.message);
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }
};
