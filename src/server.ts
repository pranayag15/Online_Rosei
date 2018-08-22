"use strict";
/*
  Import Routes
*/
import bluebird = require("bluebird");
import bodyParser = require("body-parser");
import cors = require("cors");
import express = require("express");
import * as helmet from "helmet";
import mongoose = require("mongoose");
import path = require("path");
import {
  AdminRoutes,
  AuthRoutes,
  CouponRoutes,
  UserRoutes,
} from "./routes";
import {Config} from "./shared";

global.Promise = bluebird;
mongoose.Promise = global.Promise;

export class IIITService {
  private app: any; // express server

  constructor(private hasDb = true) {
    if (hasDb) {
      let infoString: string;
      if (Config.dbSettings.authEnabled) {
        infoString = "mongodb://"  + Config.dbSettings.username + ":" + Config.dbSettings.password + "@"
                    + Config.dbSettings.connectionString + "/" + Config.dbSettings.database;
      } else {
        infoString = "mongodb://" + Config.dbSettings.connectionString + "/" + Config.dbSettings.database;
      }

      // connect to mongodb
      mongoose.connect(infoString).then(() => {
        console.log("Mongo Connected!");
      }).catch((error) => {
        throw error;
      });
    }
  }

    // Main function to start the server

  public startServer() {
    this.initServices().then(() => {
      this.initExpress();
    });
  }

  private initExpress() {
    var originsWhitelist = [
      'http://localhost:4200',
      'https://topaz-ceiling.glitch.me/'
    ];
    const options:cors.CorsOptions = {

      origin: function(origin, callback){
        var isWhitelisted = originsWhitelist.indexOf(origin) !== -1;
        callback(null, isWhitelisted);
      },
      allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "x-access-token"],
      credentials: true,
      methods: "GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE",
    };
      // create Express
    this.app = express();
    this.app.use(helmet());
    this.app.use(cors(options));
    this.app.use(express.static(path.join(__dirname,'public')));

      // make express use the bodyParser for json middleware
    this.app.use(bodyParser.json({}));

    // initializing routes
    this.initAppRoutes();
    this.app.listen(Config.apiSettings.port);
    console.log("Server started at port: " + Config.apiSettings.port);
  }

    // Routes

  private initAppRoutes() {
    this.app.get("*",(req,res)=>{
      res.sendFile(path.join(__dirname , '../src/public/index.html'))
    });

    const userRoutes: UserRoutes = new UserRoutes();
    this.app.use("/user", userRoutes.getRoutes());

    // auth Routes
    const authRoutes: AuthRoutes = new AuthRoutes();
    this.app.use("/auth", authRoutes.getRoutes());

    // admin Routes
    const adminRoutes: AdminRoutes = new AdminRoutes();
    this.app.use("/admin", adminRoutes.getRoutes());

    // coupon Routes
    const couponRoutes: CouponRoutes = new CouponRoutes();
    this.app.use("/book", couponRoutes.getRoutes());
  }

  private initServices(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
            // if you have any SDKs that need to be init, do so here
      resolve(true);
    });
  }

}
