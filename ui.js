$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  // user profile stuff 
  let $myUserProfile = $("#user-profile2");
  let $myProfileName = $("#profile-name");
  let $myUsername = $("#profile-username");
  let $myProfileAccountDate = $("#profile-account-date");
  let $myPro = $("#nav-welcome")
  // nav
  let $navPost = $("#nav-post");
  let $navWelcome = $("#nav-welcome");

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;

    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle(1000);
    $createAccountForm.slideToggle(1000);
    $allStoriesList.toggle();
  });

  /**
     * Event Handler for Clicking Porifle name
     */
  $myPro.on("click", function () {
    showProfileInfo()
    $myUserProfile.toggle();
  })

  /**
       * Event Handler for Clicking post new story nav
       */
  $navPost.on("click", function () {
    hideElements();
    $submitForm.show(300)
    $author = $("#author").text(currentUser.username)

    // const newStoryPost = StoryList.addStory(user, newStory);
    // generateStoryHTML(newStoryPost);
  })

  /**
       * Event Handler for Clicking post new story nav
       */
  $submitForm.on("submit", async function (evt) {
    evt.preventDefault();
    let title = $("#title").val();
    let url = $("#url").val();
    let newStory = {
      title,
      url
    }
    const newStoryPost = await StoryList.addStory(currentUser, newStory);
    console.log('newStoryPost :', newStoryPost);
    generateStoryHTML(newStoryPost);
  })

  /**
   * Event handler for Navigation to Homepage
   */


  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      $navWelcome.text(username);
      showNavForLoggedInUser();
    }
  }

  // show profile info if logged in 
  function showProfileInfo() {
    if (currentUser) {
      $navWelcome.text(currentUser.name);
      $myProfileName.text(`Name: ${currentUser.name}`);
      $myUsername.text(`UserName: ${currentUser.username}`);
      $myProfileAccountDate.text(`Account Created: ${currentUser.createdAt}`);
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide(1000);
    $createAccountForm.hide(1000);

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show(1000);

    // update the navigation bar
    showNavForLoggedInUser();
    showProfileInfo()
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $myUserProfile,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide(500));
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    $navPost.show();
    $navWelcome.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
      localStorage.setItem("name", currentUser.name);
      localStorage.setItem("createdAt", currentUser.createdAt);
    }
  }
});
