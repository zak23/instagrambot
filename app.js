const Client = require('instagram-private-api').V1
const moment = require('moment')

class InstagramBot {
  constructor (username, password) {
    this.device = new Client.Device(username)
    this.storage = new Client.CookieFileStorage(__dirname + `/cookies/${username}.json`)
    this.username = username
    this.password = password
    this.randomPause = randomPause
  }

  async _getSession () {
    if (!this._session) {
      this._session = await Client.Session.create(this.device, this.storage, this.username, this.password)
    }
    return this._session
  }

  async searchForUser (username) {
    return await Client.Account.searchForUser(await this._getSession(), username)
  }

  async followUser (username) {
    console.log('Following', username)
    const account = await this.searchForUser(username)
    return await Client.Relationship.create(await this._getSession(), account.id)
  }

  async unfollowUser (username) {
    const account = await this.searchForUser(username)
    return await Client.Relationship.destroy(await this._getSession(), account.id)
  }

  async like (mediaID) {
    console.log('Liking', mediaID)
    return await Client.Like.create(await this._getSession(), mediaID)
  }

  async followers () {
    const session = await this._getSession();
    const feed = new Client.Feed.AccountFollowers(await this._getSession(), await session.getAccountId())
    feed.map = item => item._params
    return await feed.all()
  }

  async following () {
    const session = await this._getSession();
    const feed = new Client.Feed.AccountFollowing(await this._getSession(), await session.getAccountId())
    feed.map = item => item._params
    return await feed.all()
  }

  async unfollowNotFollowing () {
    const followers = await this.followers()
    const following = await this.following()


    const notFollowingBack = following.filter(following => {
      let isFollowingBack = false
      followers.forEach(follower => {
        if (follower.username === following.username) isFollowingBack = true
      })
      return !isFollowingBack
    })
    if (notFollowingBack.length) {
      const unfollowNumber = Math.ceil(notFollowingBack.length)
      console.log('Numbers', followers.length, following.length,notFollowingBack.length, unfollowNumber)
      for (let i = 0; i < unfollowNumber; i++) {
        const user = notFollowingBack[notFollowingBack.length - 1 - i]
        if (user) {
          try {
            const username = user.username
            console.log('Unfollowing', username)
            await this.unfollowUser(username)
            await randomPause(3)
          } catch (e) {
            console.log('Error unfollowing', user)
          }
        }
      }
      // const nextUnfollow = getRandomInt(1000 * 60 * 3, 1000 * 60 * 7)
      // const nextUnfollowMinutes = Math.floor(nextUnfollow / (1000 * 60))
      // console.log(`Next unfollow in ${nextUnfollowMinutes} minutes (${moment().add(nextUnfollowMinutes, 'minutes').format('HH:mm')})`)
      // await pausePromise(nextUnfollow) //Unfollow 1 every 30 minutes
      // return this.unfollowNotFollowing() //loop back around and get a fresh list
    }
  }

  async hashtag (hashtag) {
    const feed = new Client.Feed.TaggedMedia(await this._getSession(), hashtag)
    feed.map = item => item._params
    return await feed.get()
  }

  async likeAndFollow (username, mediaId) {
    await this.like(mediaId)
    await randomPause(3)
    await this.followUser(username)
    await randomPause(3)
  }
}

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const randomPause = seconds => new Promise(resolve => {
  setTimeout(resolve, 1000 * getRandomInt(seconds / 2, seconds * 2))
})

const pausePromise = (milliseconds) => new Promise((resolve, reject) => {
  setTimeout(resolve, milliseconds)
})

module.exports = InstagramBot