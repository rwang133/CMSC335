"use strict";
process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    process.stdout.write('Usage pokémonGenerator.js PORT_NUMBER_HERE');
    process.exit(1);
} else {
    const portNumber = process.argv[2];
    const express = require("express");
    const path = require("path");
    const bodyParser = require("body-parser");
    const axios = require("axios");
    const app = express();

    /* mongo stuff */
    require("dotenv").config({
        path: path.resolve(__dirname, "credentialsDontPost/.env"),
    });

    const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cmsc335db.bp97t.mongodb.net/?retryWrites=true&w=majority&appName=CMSC335DB`;
    const databaseAndCollection = {
        db: process.env.MONGO_DB_NAME,
        collection: process.env.MONGO_COLLECTION,
      };
    const { MongoClient, ServerApiVersion } = require("mongodb");

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverApi: ServerApiVersion.v1,
    });

    app.set("views", path.resolve(__dirname, ""));
    app.set("view engine", "ejs");

    /* GET */
    app.get("/", (_, response) => {
        response.render("templates/index");
    });

    app.get("/build", (_, response) => {  
        const variables = {
            portNumber: portNumber
        };
        response.render("templates/build", variables);
    });

    app.get("/lookup", (_, response) => {
        const variables = {
            portNumber: portNumber
        };
        response.render("templates/lookup", variables);
    });

    app.get("/delete", (_, response) => {
        const variables = {
            portNumber: portNumber
        }
        response.render("templates/delete", variables);
    })

    /* POST */
    app.use(bodyParser.urlencoded({ extended: false }));

    async function fetchData(url) {
        try {
          const response = await axios.get(url);
          const data = response.data;
      
          return data;
      
        } catch (error) {
          console.error('Error fetching data:', error);
        }
    }

    async function genRandPokémon(num) {
        try {
            let table = "<table><th>Name</th><th>Sprite</th>";
            for (let i = 0; i < num; i++) {
                let randNum = Math.floor(Math.random() * 1026) + 1;
                let data = await fetchData(`https://pokeapi.co/api/v2/pokemon/${randNum}/`);
                table += `<tr><td>${data.name}</td><td><img src="${data.sprites.front_default}"></tr>`;
                
            }
            table += "</table>";   
            return table;
        } catch (error) {
            console.error('Error fetching data: ', error);
        }
    }

    async function insertCollection(collection) {
        try {
          await client.connect();
          await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .insertOne(collection);
        } catch (e) {
          console.error(e);
        } finally {
          await client.close();
        }
    }

    async function lookupCollection(email) {
        try {
          await client.connect();
          let filter = {email: email};
          let variables;
          const result = await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .findOne(filter);
          if (result) {
            variables = {
              email: email,
              table: `${email}'s Collection<br><br>${result.table}`
            };
          } else {
            variables = {
              table: `<p>${email}'s collection was not found.</p>`,
              email: ""
            };
          }
          return variables;
        } catch (e) {
          console.error(e);
        } finally {
          await client.close();
        }
    }

    async function removeCollection(email) {
        try {
          await client.connect();
          let filter = {email: email};
          await client
            .db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .deleteOne(filter);
        } catch (e) {
          console.error(e);
        } finally {
          await client.close();
        }
      }

    app.post("/processBuild", (request, response) => {
        (async () => {
            try {
                const table = await genRandPokémon(request.body.num);
                const variables = {
                    table: table
                }
                const obj = {
                    email: request.body.email,
                    table: table
                }
                insertCollection(obj);
                response.render("templates/processBuild", variables);
            } catch (e) {
              console.log(e);
            }
          })();
    });

    app.post("/processLookup", (request, response) => {
        (async () => {
            try {
              const result = await lookupCollection(request.body.email);
              response.render("templates/processLookup", result);
            } catch (e) {
              console.log(e);
            }
        })();
    });

    app.post("/processDelete", (request, response) => {
        (async () => {
            try {
                removeCollection(request.body.email);
                const variables = {
                  email: request.body.email
                }
                response.render("templates/processDelete", variables);
            } catch (e) {
                console.log(e);
            }
        })();
    });

    /* read */

    app.listen(portNumber);
    console.log(`Web server is running at http://localhost:${portNumber}`);

    const prompt = "Stop to shutdown the server: ";
    process.stdout.write(prompt);

    process.stdin.on("readable", function () {
        const dataInput = process.stdin.read();
        if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            process.stdout.write("Shutting down the server\n");
            process.exit(0);
        } else {
            process.stdout.write("Invalid command: " + command + "\n");
            process.stdout.write(prompt);
        }
        process.stdin.resume();
        }
    });

}