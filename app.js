angular.module('movieApp', [])
.controller('MovieController', ['$scope', '$http', function($scope, $http) {
var ctrl = this;

ctrl.userLoggedIn = false;
ctrl.username = '';
ctrl.password = '';
ctrl.authError = '';
ctrl.favorites = [];
ctrl.searchQuery = '';
ctrl.selectedGenre = '';
ctrl.sortBy = 'title';
ctrl.movies = [];
ctrl.totalResults = 0;
ctrl.currentPage = 1;
ctrl.totalPages = 0;
ctrl.loading = false;
ctrl.errorMessage = '';
ctrl.showModal = false;
ctrl.selectedMovie = null;
ctrl.genres = ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];
ctrl.showReviewForm = false;
ctrl.newReview = '';
ctrl.actorDetails = {};
ctrl.directorDetails = {};

ctrl.movieData = [
    {
        imdbID: 'tt1', Title: 'Inception', Year: '2010', Type: 'movie', Poster: 'https://m.media-amazon.com/images/I/61gz2gcfkAL._SY550_.jpg', 
        Genre: 'Sci-Fi, Thriller', Released: '16 Jul 2010', Director: 'Christopher Nolan', Actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt', 
        Plot: 'A thief who steals corporate secrets through dream infiltration is tasked with planting an idea into a CEO\'s mind.', 
        imdbRating: '8.8', Trailer: 'https://www.youtube.com/watch?v=YoHD9XEInc0', reviews: []
    },
    {
        imdbID: 'tt2', Title: 'The Shawshank Redemption', Year: '1994', Type: 'movie', Poster: 'https://m.media-amazon.com/images/I/81dLj5FeX7L._SY445_.jpg', 
        Genre: 'Drama', Released: '14 Oct 1994', Director: 'Frank Darabont', Actors: 'Tim Robbins, Morgan Freeman', 
        Plot: 'Two imprisoned men bond over several years, finding solace and redemption through acts of decency.', 
        imdbRating: '9.3', Trailer: 'https://www.youtube.com/watch?v=6hB3S9bIaco', reviews: []
    },
    {
        imdbID: 'tt3', Title: 'The Dark Knight', Year: '2008', Type: 'movie', Poster: '	https://upload.wikimedia.org/wikipedia/en/1/1c/The_Dark_Knight_%282008_film%29.jpg', 
        Genre: 'Action, Crime', Released: '18 Jul 2008', Director: 'Christopher Nolan', Actors: 'Christian Bale, Heath Ledger', 
        Plot: 'Batman faces the Joker, a criminal mastermind who seeks to create chaos in Gotham.', 
        imdbRating: '9.0', Trailer: 'https://www.youtube.com/watch?v=EXeTwQWrcwY', reviews: []
    }
];

// Login functionality
ctrl.login = function() {
    if (ctrl.username && ctrl.password) {
        // Mock authentication
        if (ctrl.username === 'user' && ctrl.password === 'password') {
            ctrl.userLoggedIn = true;
            ctrl.authError = '';
            ctrl.password = '';
            ctrl.searchMovies();
        } else {
            ctrl.authError = 'Invalid username or password';
        }
    } else {
        ctrl.authError = 'Please enter both username and password';
    }
};

// Logout functionality
ctrl.logout = function() {
    ctrl.userLoggedIn = false;
    ctrl.username = '';
    ctrl.password = '';
    ctrl.favorites = [];
    ctrl.movies = [];
    ctrl.searchQuery = '';
    ctrl.selectedGenre = '';
    ctrl.sortBy = 'title';
    ctrl.currentPage = 1;
    ctrl.totalResults = 0;
    ctrl.totalPages = 0;
    ctrl.errorMessage = '';
    ctrl.showModal = false;
    ctrl.selectedMovie = null;
    ctrl.showReviewForm = false;
    ctrl.newReview = '';
    ctrl.actorDetails = {};
    ctrl.directorDetails = {};
};

// Fetch movies from OMDB API
ctrl.fetchMovies = function(page = 1) {
    ctrl.loading = true;
    ctrl.errorMessage = '';
    ctrl.currentPage = page;
    const apiKey = 'd29e9032'; // Replace with your OMDB API key
    const query = ctrl.searchQuery || 'movie'; // Default to 'movie' if search query is empty
    const url = `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&page=${page}&apikey=${apiKey}`;

    $http.get(url)
        .then(function(response) {
            if (response.data.Response === 'True') {
                ctrl.movies = response.data.Search.map(movie => ({
                    ...movie,
                    imdbID: movie.imdbID,
                    reviews: [] // Initialize reviews array
                }));
                ctrl.totalResults = parseInt(response.data.totalResults);
                ctrl.totalPages = Math.ceil(ctrl.totalResults / 10);

                // Filter by genre if selected
                if (ctrl.selectedGenre) {
                    ctrl.movies = ctrl.movies.filter(movie => 
                        movie.Genre && movie.Genre.includes(ctrl.selectedGenre)
                    );
                }

                // Update genres dynamically
                ctrl.updateGenres();
                ctrl.sortMovies();
            } else {
                // Fallback to mock data if API fails
                ctrl.movies = ctrl.movieData.filter(movie => {
                    let matchesSearch = ctrl.searchQuery ? 
                        movie.Title.toLowerCase().includes(ctrl.searchQuery.toLowerCase()) ||
                        movie.Actors.toLowerCase().includes(ctrl.searchQuery.toLowerCase()) ||
                        movie.Director.toLowerCase().includes(ctrl.searchQuery.toLowerCase()) : true;
                    let matchesGenre = ctrl.selectedGenre ? movie.Genre.includes(ctrl.selectedGenre) : true;
                    return matchesSearch && matchesGenre;
                });
                ctrl.totalResults = ctrl.movies.length;
                ctrl.totalPages = Math.ceil(ctrl.totalResults / 10);
                ctrl.errorMessage = response.data.Error || 'No movies found, using fallback data.';
            }
        })
        .catch(function() {
            // Fallback to mock data on error
            ctrl.movies = ctrl.movieData.filter(movie => {
                let matchesSearch = ctrl.searchQuery ? 
                    movie.Title.toLowerCase().includes(ctrl.searchQuery.toLowerCase()) ||
                    movie.Actors.toLowerCase().includes(ctrl.searchQuery.toLowerCase()) ||
                    movie.Director.toLowerCase().includes(ctrl.searchQuery.toLowerCase()) : true;
                let matchesGenre = ctrl.selectedGenre ? movie.Genre.includes(ctrl.selectedGenre) : true;
                return matchesSearch && matchesGenre;
            });
            ctrl.totalResults = ctrl.movies.length;
            ctrl.totalPages = Math.ceil(ctrl.totalResults / 10);
            ctrl.errorMessage = 'Error fetching data from API, using fallback data.';
        })
        .finally(function() {
            ctrl.loading = false;
            if (ctrl.movies.length === 0) {
                ctrl.errorMessage = ctrl.errorMessage || 'No movies found matching your criteria.';
            }
        });
};

// Update genres dynamically from movie data
ctrl.updateGenres = function() {
    let genresSet = new Set();
    ctrl.movies.forEach(movie => {
        if (movie.Genre) {
            movie.Genre.split(', ').forEach(genre => genresSet.add(genre));
        }
    });
    ctrl.genres = Array.from(genresSet).sort();
    // Ensure default genres are included
    ['Action', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'].forEach(genre => {
        if (!ctrl.genres.includes(genre)) {
            ctrl.genres.push(genre);
        }
    });
};

// Search movies
ctrl.searchMovies = function(page = 1) {
    ctrl.currentPage = page;
    ctrl.fetchMovies();
};

// Clear search
ctrl.clearSearch = function() {
    ctrl.searchQuery = '';
    ctrl.selectedGenre = '';
    ctrl.currentPage = 1;
    ctrl.fetchMovies();
};

// Sort movies
ctrl.sortMovies = function() {
    ctrl.movies.sort(function(a, b) {
        if (ctrl.sortBy === 'title') {
            return a.Title.localeCompare(b.Title);
        } else if (ctrl.sortBy === 'year') {
            return parseInt(b.Year || 0) - parseInt(a.Year || 0);
        } else if (ctrl.sortBy === 'rating') {
            return parseFloat(b.imdbRating || 0) - parseFloat(a.imdbRating || 0);
        }
    });
};

// Toggle favorite
ctrl.toggleFavorite = function(movie) {
    let index = ctrl.favorites.findIndex(fav => fav.imdbID === movie.imdbID);
    if (index === -1) {
        ctrl.favorites.push(movie);
    } else {
        ctrl.favorites.splice(index, 1);
    }
};

// Check if movie is favorite
ctrl.isFavorite = function(movie) {
    return ctrl.favorites.some(fav => fav.imdbID === movie.imdbID);
};

// Get movie details
ctrl.getMovieDetails = function(imdbID) {
    ctrl.loading = true;
    const apiKey = 'd29e9032'; // Replace with your OMDB API key
    const url = `https://www.omdbapi.com/?i=${imdbID}&apikey=${apiKey}`;

    $http.get(url)
        .then(function(response) {
            if (response.data.Response === 'True') {
                ctrl.selectedMovie = {
                    ...response.data,
                    reviews: response.data.reviews || [] // Ensure reviews array exists
                };
                ctrl.showModal = true;
            } else {
                // Fallback to mock data
                ctrl.selectedMovie = ctrl.movieData.find(movie => movie.imdbID === imdbID);
                if (ctrl.selectedMovie) {
                    ctrl.showModal = true;
                    ctrl.errorMessage = 'API error, using fallback data for details.';
                } else {
                    ctrl.errorMessage = response.data.Error || 'Movie details not found.';
                }
            }
        })
        .catch(function() {
            // Fallback to mock data
            ctrl.selectedMovie = ctrl.movieData.find(movie => movie.imdbID === imdbID);
            if (ctrl.selectedMovie) {
                ctrl.showModal = true;
                ctrl.errorMessage = 'Error fetching details, using fallback data.';
            } else {
                ctrl.errorMessage = 'Error fetching movie details.';
            }
        })
        .finally(function() {
            ctrl.loading = false;
        });
};

// Close modal
ctrl.closeModal = function() {
    ctrl.showModal = false;
    ctrl.selectedMovie = null;
    ctrl.showReviewForm = false;
    ctrl.newReview = '';
};

// Add review
ctrl.addReview = function(movie) {
    ctrl.getMovieDetails(movie.imdbID);
    ctrl.showReviewForm = true;
};

// Submit review
ctrl.submitReview = function() {
    if (ctrl.newReview && ctrl.selectedMovie) {
        if (!ctrl.selectedMovie.reviews) {
            ctrl.selectedMovie.reviews = [];
        }
        ctrl.selectedMovie.reviews.push({
            user: ctrl.username,
            text: ctrl.newReview,
            date: new Date().toLocaleDateString()
        });
        ctrl.newReview = '';
        ctrl.showReviewForm = false;
    }
};

// Cancel review
ctrl.cancelReview = function() {
    ctrl.showReviewForm = false;
    ctrl.newReview = '';
};

// Get rating stars
ctrl.getRatingStars = function(rating) {
    let numStars = Math.round(parseFloat(rating || 0) / 2);
    return new Array(numStars);
};

// Get director details (mock)
ctrl.getDirectorDetails = function(director) {
    ctrl.directorDetails = { name: director, movies: [] };
    alert('Director details for: ' + director);
    // In a real app, this would fetch director info
};

// Get actor details (mock)
ctrl.getActorDetails = function(actors) {
    const actorList = actors.split(', ');
    ctrl.actorDetails = actorList.map(actor => ({ name: actor, movies: [] }));
    alert('Actors: ' + actors);
    // In a real app, this would fetch actor info
};

// Share movie
ctrl.shareMovie = function(movie) {
    const shareUrl = `https://www.imdb.com/title/${movie.imdbID}/`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Movie link copied to clipboard!');
    }).catch(() => {
        alert('Failed to copy link to clipboard.');
    });
};
}]);