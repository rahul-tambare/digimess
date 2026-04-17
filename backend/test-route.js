const router = require('./routes/messRoutes');
console.log(router.stack.map(layer => layer.route && layer.route.path));
