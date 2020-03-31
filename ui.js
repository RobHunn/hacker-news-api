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
  const $myArticles = $("#my-articles");
  // user profile stuff 
  let $myUserProfile = $("#user-profile2");
  let $myProfileName = $("#profile-name");
  let $myUsername = $("#profile-username");
  let $myProfileAccountDate = $("#profile-account-date");
  let $myPro = $("#nav-welcome")
  const $editArticleForm = $("#edit-article-form")
  let $findMe = $("#findMe")
  // nav
  let $navPost = $("#nav-post");
  let $navWelcome = $("#nav-welcome");
  let $navMyPosts = $("#nav-my-posts");

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
    console.log('ownstories from login :', currentUser.ownStories);
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
     * Event Handler for Clicking nav Porfile name
     */
  $myPro.on("click", function () {
    showProfileInfo()
    $myUserProfile.toggle();
  })

  /**
     * Event Handler for Clicking delete OR edit icon on myposts
     */
  $myArticles.on('click', 'img', async function (evt) {

    const $targetId = evt.target.parentNode.parentNode.id
    console.log('evt.target.id :', $targetId);
    if (evt.target.id === 'delete-post') {
      let yesOrNo = prompt('sure you want to delete, theres no going back...');
      if (yesOrNo && yesOrNo.toLocaleLowerCase() === 'yes') {
        const $res = await StoryList.deleteStory(currentUser, $targetId)
        console.log('res :', $res);
        if ($res) {
          currentUser.ownStories = currentUser.ownStories.filter(e => e.storyId !== $targetId);
          $myArticles.empty()
          for (let story of currentUser.ownStories) {
            const result = generateStoryHTMLmyPosts(story);
            $myArticles.append(result);
          }
          $myArticles.show(500);
        }
      }
    } else if (evt.target.id === 'edit-post') {
      $findMe.val($targetId)
      $editArticleForm.show()
    } else {
      return
    }
  })

  $editArticleForm.on('submit', async function (evt) {
    // const $targetId = evt.target.parentNode.parentNode.id
    evt.preventDefault();
    $myArticles.hide();
    let id = $("#findMe").val();
    console.log('findeMe  :', id);
    let title = $("#edit-title").val();
    let url = $("#edit-url").val();
    let newStory = {
      title,
      url
    }
    const $res = await StoryList.patchStory(currentUser, id, newStory)
    console.log('res :', $res);
    $editArticleForm.hide();
    if ($res) {
      currentUser.ownStories = currentUser.ownStories.filter(e => e.storyId !== id);
      currentUser.ownStories.unshift($res)
      $navMyPosts.trigger('click')
    }
  })

  /**
     * Event Handler for Clicking nav my posts
     */
  $navMyPosts.on("click", function () {
    $myArticles.empty()
    $allStoriesList.hide(500);
    for (let story of currentUser.ownStories) {
      const result = generateStoryHTMLmyPosts(story);
      $myArticles.append(result);
    }
    $myArticles.toggle(500);
  })

  /**
       * Event Handler for Clicking post new story nav
       */
  $navPost.on("click", function () {
    $allStoriesList.hide(500);
    $submitForm.toggle(500)
    $author = $("#author").text(currentUser.username)
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
    currentUser.ownStories.unshift(newStoryPost);
    console.log('newStoryPost :', newStoryPost);
    $submitForm.hide(700);
    $myArticles.hide();
    await generateStories();
    $allStoriesList.show(500);
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
      console.log('database :', currentUser.ownStories);
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
    console.log('currentUser from login form :', currentUser);
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


  /**
   * A function to render HTML for nav my-posts link
   */

  function generateStoryHTMLmyPosts(story) {
    console.log('story from generateHTML :', story);
    let hostName = getHostName(story.url);

    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <span>
          <img id="delete-post" style="margin-right:10px" width="15px" height="15px" src="trash.png">
        </span>
        <span>
          <img id="edit-post" style="margin-right:10px" width="15px" height="15px" src="edit-post.png">
        </span>
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
    $navMyPosts.show();
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
