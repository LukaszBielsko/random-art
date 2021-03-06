const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const { Item, User, Product, Order } = require('../mongo/schema');
const { transporter, makeEmail } = require('../mail');
const stripe = require('../stripe');

const Mutation = {
  createProduct: async (parent, { title, price, description }) => {
    const product = new Product({
      title,
      price,
      description,
    });
    product.save();
    return product;
  },

  addProductToCart: async (parent, args, ctx) => {
    const user = await User.findById(ctx.request.userId);
    // this is data duplication
    // at the moment learing about relations is not my main concern
    const product = await Product.findById(args.productId);
    user.cart.push(product);
    user.save();
    return product;
  },

  removeFromCart: async (parent, { id }, ctx) => {
    const user = await User.findById(ctx.request.userId);
    const updatedCart = user.cart.filter(
      // this probably can and should be changed
      product => product._id.toString() !== id
    );
    user.cart = updatedCart;
    user.save();
    return id;
  },

  createItem: async (parent, args, ctx, info) => {
    const item = new Item({
      title: args.title,
      place: args.place,
      description: args.description,
      image: args.image,
      largeImage: args.largeImage,
    });
    await item.save(err => {
      if (err) return console.error('error', err);
    });

    return item;
  },

  updateItem: async (parent, args, ctx, info) => {
    const item = await Item.findById(args.id);
    item.title = args.title || item.title;
    item.place = args.place || item.place;
    item.description = args.description || item.description;
    item.save();

    return item;
  },

  deleteItem: async (parent, args, ctx, info) => {
    // 1. find the item
    /* TODO  2. check if user owns it and has permissions  */
    // 3. delete it

    const item = await Item.findById(args.id);

    Item.deleteOne({ _id: args.id }, () => {
      console.log(`Item ${args.id} --- DELETED`);
    });

    return item;
  },

  signUp: async (parent, args, ctx, info) => {
    const password = await bcrypt.hash(args.password, 10);
    const user = new User({
      ...args,
      password,
    });
    await user.save();
    // create token
    const token = jwt.sign({ userId: user._id }, process.env.APP_SECRET);
    // send token as a cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });

    return user;
  },

  signIn: async (parent, { email, password }, ctx, info) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found.');
    }
    // await bcrypt.compare(password, user.password, (error, isMatch) => {
    //   console.log('isMatch', isMatch);
    //   console.log('err', error);
    //   if (isMatch) {
    //     const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //     ctx.response.cookie('token', token, {
    //       httpOnly: true,
    //       maxAge: 1000 * 60 * 60 * 24 * 365,
    //     });
    //   }
    // });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password!');
    }
    // 3. generate the JWT Token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365,
    });
    return user;
  },

  signOut: (parent, args, ctx, info) => {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye!' };
  },

  requestPasswordReset: async (parent, { email }, ctx, info) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found.');
    }
    const randomBytesPromise = promisify(randomBytes);
    const resetToken = (await randomBytesPromise(20)).toString('hex');
    const tokenExpiry = Date.now() + 60 * 60 * 1000;
    user.resetToken = resetToken;
    user.tokenExpiry = tokenExpiry;
    user.save();
    transporter.sendMail(
      {
        to: email,
        subject: 'Password reset',
        html: makeEmail(resetToken),
      },
      mailInfo => {
        console.log({ mailInfo });
      }
    );
    return { message: 'Password reset request successfull' };
  },

  resetPassword: async (
    parent,
    { email, password, confirmPassword, resetToken },
    ctx,
    info
  ) => {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found.');
    }
    if (user.resetToken !== resetToken) {
      throw new Error('Wrong token!');
    }

    /* TODO work this out man, work it! */
    /* TODO this is wrong, man! sth wrong with the time, as password will reset anyway */

    if (user.tokenExpiry > Date.now() + 60 * 60 * 1000) {
      throw new Error('Token expired');
    }
    if (password === confirmPassword) {
      const newPassword = await bcrypt.hash(password, 10);
      user.password = newPassword;
      user.resetToken = '';
      user.save();
    } else {
      throw new Error("Passwords don't match");
    }
    // create token
    const token = jwt.sign({ userId: user._id }, process.env.APP_SECRET);
    // send token as a cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year cookie
    });
    return { message: 'Password reset successfull' };
  },

  createOrder: async (parent, args, ctx, info) => {
    const user = await User.findById(ctx.request.userId);
    if (!user) {
      throw new Error('User not found.');
    }
    const amount = user.cart.reduce((prev, cur) => prev + cur.price, 0);
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token,
    });
    const order = new Order({
      products: [...user.cart],
      total: amount,
    });
    user.orders.push(order);
    user.cart = [];
    user.save();
    return order;
  },
};

module.exports = Mutation;
