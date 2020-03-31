const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  static async getStories() {
    try {
      const response = await axios.get(`${BASE_URL}/stories`);
      const stories = response.data.stories.map(story => new Story(story));
      const storyList = new StoryList(stories);
      console.log('im storyList', storyList);
      return storyList;
    } catch (error) {
      console.log('error :', error);
      return { 'message': error }
    }
  }

  static async addStory(user, newStory) {
    try {
      const response = await axios.post(`${BASE_URL}/stories`,
        {
          "token": user.loginToken,
          "story": {
            "author": user.username,
            "title": newStory.title,
            "url": newStory.url
          }
        });
      let story = new Story(response.data.story);
      return story;
    } catch (error) {
      console.log('error :', error);
      return { 'message': error }
    }
  }

  static async deleteStory(user, postId) {
    try {
      const res = await axios({
        url: `${BASE_URL}/stories/${postId}`,
        method: "DELETE",
        data: {
          token: user.loginToken
        },
      });
      let msg = res.data.message;
      return msg
    } catch (error) {
      console.log('error :', error);
      return { 'message': error }
    }
  }
}

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }
}

/**
 * Class to represent a single story.
 */

class Story {

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
  static async patchStory(user, storyId, newStory) {
    try {
      const response = await axios.patch(`${BASE_URL}/stories/${storyId}`,
        {
          "token": user.loginToken,
          "story": {
            "title": newStory.title,
            "url": newStory.url
          }
        });
      let story = response.data.story;
      story = new Story(story);
      return story;
    } catch (error) {
      console.log('error :', error);
      return err = { 'message': error }
    }
  }
}