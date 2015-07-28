(function(angular) {
	'use strict';

	angular.module('xpsui:controllers')
	.controller(
		'xpsui:SecurityLogoutCtrl',
		[ '$scope', 'xpsui:SecurityService', '$location', '$localStorage',
				function($scope, SecurityService, $location, $localStorage) {
					$scope.logout = function() {
						$scope.$storage = $localStorage;
						$scope.$storage.rememberMe = false;
						SecurityService.getLogout().then(function() {
							$scope.security.currentUser = undefined;
							//delete $localStorage.profile;
							//delete $localStorage.rememberMe;
							$location.path('/login');
						});
					};
				}
	]);
	
}(window.angular));