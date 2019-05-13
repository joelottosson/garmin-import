const puppeteer = require('puppeteer');

class ActivityImporter {
  constructor(username, password, browserVisible) {
    this.username = username;
    this.password = password;
    this.headless = !browserVisible;
    this.numberOfImported = 0;
    this.browser = null;
    this.page = null;

    // Selectors used on page
    this.selectors = {
      username: '#username',
      password: '#password',
      login: '#login-btn-signin',
      activityName: '#activityName',
      activityType: 'activityType',
      startDate: '#activityBeginDate>input[id^="datePicker"]',
      startTime: 'span.timePickerPlaceholder>input[id^="timePicker"]',
      durationHours: '#durationControlsPlaceholder>input[id$="time-hour"]',
      durationMinutes: '#durationControlsPlaceholder>input[id$="time-minute"]',
      durationSeconds: '#durationControlsPlaceholder>input[id$="time-second"]',
      distance: '#activitySummarySumDistance',
      description: '#description',
      save: '#save'
    };
  }

  async import(activities) { //name;type;dateTime;duration;distance;note
    await this._login();
    const startTime = new Date();
    for (const activity of activities) {
      try {
        await this._uploadActivity(activity);
        this.numberOfImported++;
      } catch (err) {
        console.log('Failed to import activity:\n' + JSON.stringify(activity));
        const elapsedSec = Math.round((new Date() - startTime) / 1000);
        console.log(`Number of imported activities: ${this.numberOfImported} in ${elapsedSec} sec.`);
        throw err;
      }
    }
    await this.page.waitFor(3000);
    await this.browser.close();
    const elapsedSec = Math.round((new Date() - startTime) / 1000);
    console.log(`Number of imported activities: ${this.numberOfImported} in ${elapsedSec} sec.`);
  }

  async _uploadActivity(activity) {
    // Load manual activity page
    await this.page.goto('https://connect.garmin.com/modern/activity/manual');
    await this.page.waitFor(this.selectors.activityName);

    // Set activity name
    await this.page.$eval(this.selectors.activityName, (el, name) => el.value = name, activity.name);
    await this._selectOption(this.selectors.activityType, activity.type);

    // Set date and time
    await this.page.$eval(this.selectors.startDate, (el, date) => el.value = date, this._formatDate(activity.dateTime));
    await this.page.$eval(this.selectors.startTime, (el, time) => el.value = time, this._formatTime(activity.dateTime));
    if (activity.distance > 0) {
      await this.page.type(this.selectors.distance, activity.distance.toString());
    }

    // Set duration
    const dur = this._calcDuration(activity.duration);
    await this._clearAndSetInput(this.selectors.durationHours, dur.hours.toString());
    await this._clearAndSetInput(this.selectors.durationMinutes, dur.minutes.toString());
    await this._clearAndSetInput(this.selectors.durationSeconds, dur.seconds.toString());

    // Set description
    await this.page.$eval(this.selectors.description, (el, note) => el.value = note, activity.note);

    // Click save button
    await this.page.click(this.selectors.save)

    // Wait until activity has been registered, we assume its done when activity input is no longer visible
    await this.page.waitFor((selector) => !document.querySelector(selector), this.selectors.activityName);
  }

  async _login() {
    // Launch Garmin website
    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: ['--start-maximized']
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1040 });
    await this.page.goto('https://connect.garmin.com/signin/?service=https://connect.garmin.com/modern/');

    // Login to your account
    await this.page.waitFor(3000);
    const loginFrame = await this.page.frames().find(f => f.url().includes('sso.garmin.com'));
    await loginFrame.$eval(this.selectors.username, (el, username) => el.value = username, this.username);
    await loginFrame.$eval(this.selectors.password, (el, password) => el.value = password, this.password);

    await loginFrame.click(this.selectors.login)
    await this.page.waitFor(3000);
  }

  async _selectOption(selectId, optionText) {
    if (optionText) {
      const option = (await this.page.$x(`//*[@id = "${selectId}"]//option[text() = "${optionText}"]`))[0];
      const value = await (await option.getProperty('value')).jsonValue();
      await this.page.select(`#${selectId}`, value);
    }
  }

  async _clearAndSetInput(selector, val) {
    await this.page.focus(selector);
    await this.page.keyboard.press('Delete');
    await this.page.keyboard.press('Delete');
    await this.page.keyboard.press('End');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.press('Backspace');
    await this.page.keyboard.type(val);
  }

  _pad(num, size) {
    var s = '0000' + num;
    return s.substr(s.length - size);
  }

  _formatDate(d) {
    return `${d.getFullYear()}/${this._pad(d.getMonth() + 1, 2)}/${this._pad(d.getDate(), 2)}`;
  }

  _formatTime(d) {
    return `${this._pad(d.getHours(), 2)}:${this._pad(d.getMinutes(), 2)}`;
  }

  _calcDuration(sec) {
    const hours = Math.floor(sec / 3600);
    sec %= 3600;
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return { hours, minutes, seconds };
  }
}

module.exports = {
  ActivityImporter
};
