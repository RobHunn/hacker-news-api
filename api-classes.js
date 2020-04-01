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
      return storyList;
    } catch (error) {
      console.log('error :', error);
      return { 'message': error }
    }
  }

  static async getOneStory(storyId) {

    try {
      const res = await axios.get(`${BASE_URL}/stories/${storyId}`);
      const newFav = new Story(res.data.story);
      return newFav;
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
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];
  }

  static async addFav(user, storyId) {
    const res = await axios.post(`${BASE_URL}/users/${user.username}/favorites/${storyId}`, {
      "token": user.loginToken
    });
    console.log('res  i be res :', res);
    return res.data
  }

  static async create(username, password, name) {

    try {
      const response = await axios.post(`${BASE_URL}/signup`, {
        user: {
          username,
          password,
          name
        }
      });
      const newUser = new User(response.data.user);
      newUser.loginToken = response.data.token;
      return newUser;
    } catch (error) {
      console.log('error :', error);
      return { 'message': error }
    }
  }

  static async login(username, password) {
    try {
      const response = await axios.post(`${BASE_URL}/login`, {
        user: {
          username,
          password
        }
      });
      const existingUser = new User(response.data.user);
      existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
      existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
      existingUser.loginToken = response.data.token;
      return existingUser;

    } catch (error) {
      console.log('error :', error);
      return { 'message': error }
    }
  }

  static async getLoggedInUser(token, username) {

    if (!token || !username) return null;

    try {
      const response = await axios.get(`${BASE_URL}/users/${username}`, {
        params: {
          token
        }
      });
      const existingUser = new User(response.data.user);
      existingUser.loginToken = token;
      existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
      existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
      return existingUser;
    } catch (error) {
      console.log('error :', error);
      return { 'message': error };
    }
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

}