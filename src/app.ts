//To  make sure any property i add to response or request would be recognized
declare module 'express-serve-static-core' {
	interface Response {
		statusJson: (statusCode: number, data: {})=>void
	}
}

import { Express } from 'express-serve-static-core';
import express, { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import createError from 'http-errors';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import redis from 'redis';
import dotenv from 'dotenv';
import sassMiddleware from 'node-sass-middleware';
import * as http from 'http';
import * as socketio from 'socket.io';
import { RegisterInfo, RegisterMessenger, RegisterGroupMessenger, Usernames, OnlineInfo, ChainEmmiter, Typings } from './interfaces';
//import { upload } from './middlewares';

dotenv.config();
const redisPort = 6379;
export const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('connect', ()=>{ console.log('connect'); });
redisClient.on('ready', ()=>{ console.log('ready'); });
redisClient.on('error', (err)=>{ console.log(err); });

const app: Express = express();

/**
 * Create HTTP server.
 */
const server: http.Server = http.createServer(app);

export const io: socketio.Server = new socketio.Server();
io.attach(server);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
/*app.set('etag', false);
app.disable('etag');*/

app.use(logger('dev'));
app.use('/api/uploads', express.static('uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
/*app.use((req: Request, res: Response, next: NextFunction)=>{
  res.set('Cache-Control', 'no-store');
  next();
});*/
app.use(sassMiddleware({
  src: path.join(__dirname, 'public/stylesheets/sass'),
  dest: path.join(__dirname, 'public/stylesheets'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
  prefix: '/stylesheets'
}));
app.use(express.static(path.join(__dirname, 'public')));


app.use((req: Request, res: Response, next: NextFunction)=>{
	res.statusJson = (statusCode: number, data: {}): void=>{
		let obj = {
			...data,
			statusCode: statusCode
		}
		res.status(statusCode).json(obj);
		return;
	};
	next();
});

import { AppRouter } from './AppRouter';
app.use(AppRouter.getInstance());

import './models/db';
import './controllers/RootController';
import './controllers/APIController';
import './controllers/AuthController';

// catch 404 and forward to error handler
app.use((req: Request, res: Response, next: NextFunction)=>{
  next(createError(404));
});

// error handler
app.use((err: any, req: Request, res: Response, next: NextFunction)=>{
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

//map having my sockets id maps to the names of users involved in that conversation.
export const sids = new Map<string, Usernames>();
export const onlines = new Map<string, OnlineInfo>();
//io related issues
io.on('connection', (socket: socketio.Socket)=>{
  let onlineStatus: OnlineInfo;
	console.log('connection', socket.id);
	socket.emit('status', { id: socket.id });

  socket.on('register-id', (info: RegisterInfo)=>{
    onlineStatus = { 
      username: info.username,
      online: true
    };
    onlines.forEach((onlineInfo: OnlineInfo, id: string)=>{
      if(onlineInfo.username === info.username){
        onlines.delete(info.socketId);
      }
    });
    onlines.set(info.socketId, onlineStatus);
    io.emit('online', onlineStatus);
  });
  socket.on('register-chatroom', (info: RegisterMessenger)=>{
    //with this operation, it deletes every other instance of conversaion between this two persons,
    //its don so that the map doesnt get crowded if the user keeps creating different instances (tabs, devices)
    //but of course i could try to change it and allow 2 instance only, so it doesnt get crowded.
    sids.forEach((usernames: Usernames, id: string)=>{
      if(usernames.receiver === info.usernames.receiver && usernames.sender === info.usernames.sender){
        sids.delete(id);
      }
    });
    sids.set(info.socketId, info.usernames);
    socket.on('typing', (info: Typings)=>{
      const chainIO = ({ localIO, socketsToSendTo }: ChainEmmiter ): ChainEmmiter=>{
        //console.log('chain', sids);
        sids.forEach((usernames: Usernames, id: string)=>{
            if( (usernames.receiver === info.usernames.receiver && usernames.sender === info.usernames.sender) || (usernames.receiver === info.usernames.sender && usernames.sender === info.usernames.receiver) ) {
              socketsToSendTo = true;
              //chain rooms based on the users id
              localIO = localIO.to(id);
            }
          });
        return { localIO, socketsToSendTo };
      }
      const emitter = ({ localIO, socketsToSendTo }: ChainEmmiter, dataToSend: Typings | { [key: string]: string | Date | boolean | Usernames } ): void=>{
        if(socketsToSendTo){
          localIO.emit('io-typing', dataToSend);
        }
      }
      const data: Typings = {
        usernames: info.usernames, 
        typing: info.typing
      };
      emitter(
        chainIO({ 
          localIO: io,
          socketsToSendTo: false
        }),
        data
      );
    });
    socket.on('chatroom-disconnect', ()=>{
      socket.disconnect();
    });
  });
  socket.on('register-grouproom', (info: RegisterGroupMessenger)=>{
    socket.join(info.groupname);
    socket.on('grouproom-disconnect', ()=>{
      socket.disconnect();
    });
  })

	socket.on('disconnect', ()=>{
		console.log('Disconnect', socket.id);
    for(let [id, onlineInfo] of onlines){
      if(id === socket.id){
        onlineStatus = {
          username: onlineInfo.username,
          online: false
        };
        io.emit('online', onlineStatus);
        onlines.delete(id);
        continue;
      }
    }
    const usernames = sids.get(socket.id);
    if(usernames){
      sids.delete(socket.id);
    }
	});
});
/*
  //io
  export const sids = new Map<string, string>();
  io.on('connection', (socket: socketio.Socket)=>{
    let onlineStatus: SendOnline;
    console.log('connection', socket.id);
    socket.emit('status', { id: socket.id });

    socket.on('registerId', (info: SendInfo)=>{
      sids.set(info.username, info.id);
      onlineStatus = { 
        username: info.username,
        online: true
      };
      console.log(sids);
      io.emit('online', onlineStatus);
    });

    socket.on('disconnect', ()=>{
      console.log('Disconnect', socket.id);
      sids.forEach((value: string, key: string)=>{
        console.log(value, key);
        if(value === socket.id){
          onlineStatus = {
            username: key,
            online: false
          };
          io.emit('online', onlineStatus);
        }
      });
    });
  });
 */

/**
 * Module dependencies.
 */

var debug = require('debug')('chatapp:server');

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');


app.set('port', port);


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: any) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: any) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : (addr)? 'port ' + addr.port: '';
  debug('Listening on ' + bind);
  console.log("=============");
  console.log("=============");
  console.log("App is listening from port: " + port);
}
