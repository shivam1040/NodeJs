const Product = require('../models/product');
const Order = require('../models/order');
const fs = require('fs')
const path = require('path')
const pdfkit = require('pdfkit');
const e = require('express');
const ITEMS_PER_PAGE = 2
const stripe = require('stripe')('pv')

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems;

  Product.find().countDocuments().then(n => {
    totalItems = n
    return Product.find()
    .skip((page-1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
      .then(products => {
        res.render('shop/product-list', {
          prods: products,
          pageTitle: 'Products',
          path: '/prodcuts',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page -1,
          lastPage: Math.ceil(totalItems /  ITEMS_PER_PAGE)
        });
      })
  })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1
  let totalItems;

  Product.find().countDocuments().then(n => {
    totalItems = n
    return Product.find()
    .skip((page-1) * ITEMS_PER_PAGE)
    .limit(ITEMS_PER_PAGE)
      .then(products => {
        res.render('shop/index', {
          prods: products,
          pageTitle: 'Shop',
          path: '/',
          currentPage: page,
          hasNextPage: ITEMS_PER_PAGE * page < totalItems,
          hasPreviousPage: page > 1,
          nextPage: page + 1,
          previousPage: page -1,
          lastPage: Math.ceil(totalItems /  ITEMS_PER_PAGE)
        });
      })
  }).catch(err => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
  });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products
  let total = 0
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      products = user.cart.items;

      products.forEach(p => {
        total+=p.quantity * p.productId.price
      })
      return stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: products.map(p=>{
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price*100,
            currency: 'usd',
            quantity: p.quantity
          }
        }),
        success_url: req.protocol+ '://' + req.get('host') + '/checkout/success',
        cancel_url: req.protocol+ '://' + req.get('host') + '/checkout/cancel'
      })
    })
    .then(session => {
      res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout',
        products: products,
        totalSum: total,
        sessionId: session.id
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      console.log(err)
      return next(error);
    });
}

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId

  Order.findById(orderId).then(o=>{
    if(!o)
      return next(new Error('no such order'))
    if(o.user.userId.toString() !== req.user._id.toString())
      return next(new Error('Unauthorized'))
    const invoiceName = 'invoice-'+orderId+'.pdf'
    const invoicePath = path.join('data', 'invoices', invoiceName)
    const pdfDoc = new pdfkit()

    res.setHeader('Content-Type', 'application/pdf')
    //   //way to open download inline or as download
    res.setHeader('Content-Disposition', 'attachment; filename="'+invoiceName+'"')
    pdfDoc.pipe(fs.createWriteStream(invoicePath))
    pdfDoc.pipe(res)
    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    })
    o.products.forEach(p=>{
      pdfDoc.text(p.product.title)
    })

    pdfDoc.end()
    // fs.readFile(invoicePath, (err, data)=> {
    //   if(err)
    //     return next(err)
    //   res.send(data)
    // })
    //streaming data
    // const file = fs.createReadStream(invoicePath)

    //file.pipe(res)
  }).catch(e=>next(e))
}
