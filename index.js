// Dependencies
const admin = require("firebase-admin"), // object/node module that listens for firebase changes
      program = require('commander'); // Helps with command line arguments

// Global vars
var db, // main glider reference on firebase
    evo;

// Connect to the database
var connectDB = function(production) {
  return new Promise((resolve, reject) => {
    let serviceAccount; // api key/credentials for firebase

    if (production) {
      console.log("Running on production");
      serviceAccount = require('./alphamorphs-firebase-adminsdk-9jr66-890dc3046c.json');
    } else {
      serviceAccount = require('./alphamorph-test-fd60d-firebase-adminsdk-qvut5-ae8772a93d.json');
    }

    // initializing the app using the credentials
    try {
      if (production) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://alphamorphs.firebaseio.com/"
        });
      } else {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          databaseURL: "https://alphamorph-test-fd60d.firebaseio.com"
        });
      }

      db = admin.database().ref('glider');
      evo = db.child('evolution');

      resolve();
    } catch (ex) {
      reject(ex);
    }
  });
}

var initialize = function(snapVal, snapKey) {
  return new Promise((resolve, reject) => {
    // randomizing a seed
    let snapGlider = snapVal.gliders[0],
        seed = randomize.randomize(snapGlider.params, snapGlider.evalEquationParams);

    // if the seed's Flyability is 0 or less, keep randomizing
    while(seed["Flyability"] <= 0){
      seed = randomize.randomize(seed, snapGlider.evalEquationParams);
    }

    // saving the seed
    evo.child(snapKey + '/gliders/0/')
       .update({seed: seed})
       .then(resolve(seed))
       .catch((err) => {
         reject(err)
       });
  });
}

// Logic starts here
program
  .version('1.0.0')
  .option('-p, --production', 'Run on the production database.')
  .option('-s, --start [index]', 'Starting index')
  .option('-e, --end [index]', 'Ending index (inclusive)')
  .parse(process.argv);


if (program.start >= 0 && program.end > 0 && program.start < program.end) {
  connectDB(program.production)
    .then(() => {
      let start = parseInt(program.start),
          end = parseInt(program.end);

      for (let metaIndex = start; metaIndex <= end; metaIndex++) {
        evo.child('meta_evolution_' + metaIndex).remove();
        console.log("Deleting " + metaIndex);
      }

      // process.exit(1);
      console.log("Don't kill this process yet. Please verify on the Firebase website.");
    })
    .catch((ex) => {
      console.error(ex);
    })
} else {
  console.error("Please enter valid starting and ending indexes");
  process.exit(0);
}
