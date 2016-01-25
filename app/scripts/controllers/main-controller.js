app.controller('MainController', MainController);

function MainController($scope, Error, CurrentUser, UserState, Game, Mobile){
    $scope.user = CurrentUser;
    $scope.game = Game;
    $scope.validationError = Error;
    $scope.onMobile = Mobile;
    $scope.state = UserState;
    $scope.howToPlayButton = false;

    if(!$scope.onMobile) {
      Game.createNew();
    }

    $scope.howToPlay = function(){
        $scope.howToPlayButton = !$scope.howToPlayButton;
    }

    $scope.connectToGame = function (id){
        if(!id) {Error.message = "You need to enter an ID."; return;}
        if(id.length !== 6) {Error.message = "The ID should be 6 characters long."; return;}

        id = id.toUpperCase();
        Game.connectTo(id);
    }

    $scope.setUser = function(name){
        if(!name) {Error.message = "You need to enter a name."; return;}
        Error.message = "";
        CurrentUser.setUser(name);
    }


    $scope.toggleReady = function(){
      $scope.user.ready = !$scope.user.ready;
      CurrentUser.toggleReady($scope.user.ready);
    }

}
