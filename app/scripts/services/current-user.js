app.service('CurrentUser', CurrentUser);

function CurrentUser(UserState, Game, FirebaseRef, $firebaseAuth, Error, $rootScope){
    var self = this,
        colors = ['pink', 'green', 'blue', 'red', 'orange'],
        avatars = ['fish', 'cat', 'bird', 'snail'],
        color = colors[Math.floor(Math.random() * colors.length)],
        avatar = avatars[Math.floor(Math.random() * avatars.length)];


    function setDetails(name, id){
        var user = {};
        self.name = user.name = name;
        self.score = user.score = 0;
        self.ready = user.ready = false;
        self.color = user.color = color;
        self.id = user.id = id;
        self.avatar = user.avatar = avatar;
        return user;
    }




    this.toggleReady = function(status){
        this.ready = status;
        this.ref.update({ready: status});
    }

    this.setUser = function(name){
        $firebaseAuth(FirebaseRef).$authAnonymously().then(function(authData) {
            var user = setDetails(name, authData.uid);

            // Försöka göra så att man inte kan få samma avatar + färg som nån annan
            // var index = colors.indexOf(user.color);
            // colors.splice(index, 1);
            // console.log(colors);
            //
            // var index2 = avatars.indexOf(user.avatar);
            // avatars.splice(index2, 1);
            // console.log(avatars);

            console.log("Logged in as:", authData.uid);
            self.ref = Game.ref.child('players').child(authData.uid);
            self.ref.set(user);
            self.ref.onDisconnect().remove();

            UserState.state = 'registered';
        })
         .catch(function(error) {
          console.error("Authentication failed:", error);
          Error.message = "Could not register user. Please try again.";
          if(!$rootScope.$$phase) $rootScope.$apply();
        });
    }

    this.chooseAnswer = function(answer){
        self.answer = answer;
        self.ref.update({answer: answer});
    };

    this.addScore = function(points){
        self.score += points;
        self.ref.update({score: self.score});
    }

    this.ref = null;
}
