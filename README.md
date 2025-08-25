## Donation Train Widget – Description

The **Donation Train** is a visually dynamic overlay for StreamElements that animates a train of donor “cars” whenever multiple donations occur in succession. Each donor is represented by a train car containing their avatar, donation amount, and name, while the locomotive emits animated smoke that scales based on activity.

### General Operation

1. **Triggering the Train**

   * The train activates when the number of queued donations reaches the **Minimum Donations** threshold.
   * Donations received before the threshold are queued until enough donations arrive.

2. **During the Train**

   * Each donor is displayed as a car behind the locomotive.
   * Donation amounts are summed per donor for the current train and displayed above their avatar.
   * Cars are sorted by total donation amount, largest first.
   * The locomotive emits continuous smoke puffs, which scale in number, speed, and angle depending on the total number and amount of donations.

3. **Ending the Train**

   * The train automatically ends after the **Train Duration** expires.
   * Once the train ends, a **scoreboard** appears for a configurable number of seconds showing the top donors.
   * A **cooldown** period prevents immediate retriggering of the train.

### Settings

| Setting                  | Description                                                             |
| ------------------------ | ----------------------------------------------------------------------- |
| `locomotiveUrl`          | Image URL for the locomotive.                                           |
| `carUrl`                 | Image URL for the train cars.                                           |
| `smokeUrl`               | Image URL for smoke puffs.                                              |
| `minDonations`           | Minimum number of donations required to start a train.                  |
| `cooldownMinutes`        | Duration (minutes) before another train can start after one ends.       |
| `trainDurationMinutes`   | Duration (minutes) for each train.                                      |
| `avatarSize`             | Pixel size for train.                                                   |
| `smokeBaseAmount`        | Base number of smoke puffs per emission.                                |
| `smokeDonationThreshold` | Donations or amount threshold per smoke stage (affects puff intensity). |
| `nameFontPx`             | Sets font size for name of donator below the train.                     |
| `amountFontPx`           | Font size for Donations on top of the train.                            |

### Summary

The **Donation Train widget** provides a dynamic, visual way to reward and recognize donors in real-time. It ensures that donor activity is celebrated collectively, with a fun animated train and adaptive smoke effects that visually reflect the generosity of the community.


### Installation Instructions

1. **Download the current release**
    * https://github.com/ksduster/Donation-Train/releases/latest
    * Download the Source code (zip)
    
2. **Extract the zip file**
    * Right click on the file, select **Extract All**

3. **Open each file with notepad**
    * Right click on each widget file and select Open With > **Notepad**
    
4. **Go To Streamelements.com**
    * Go to your streamelements dashboard https://streamelements.com/dashboard
    * On the left side, exxpand Streaming Tools
    * Select Overlays
    * At the top right corner select NEW OVERLAY

5. **Overlay Editor**
    * Set your overlay resolution (1080p is default) and click start
    * On the left, select ADD WIDGET
    * From the menu that shows, go to STATIC / CUSTOM > and select Custom Widget

6. **HTML**
        * Open the editor at the top left corner
        * Go to your notepad that has **widget.html**
        * Select all text in the file
        * Copy the text to the clipboard
        * Go back to streamelements editor
        * In the HTML tab, DELETE everything there.
        * Right click inside the editor text field and select paste, DO NOT CLOSE THIS WINDOW
    
7.  **CSS**
        * Go to your notepad that has **widget.CSS**
        * Select all text in the file
        * Copy the text to the clipboard
        * Go back to streamelements editor
        * In the CSS tab, DELETE everything there
        * Right click inside the editor text field and select paste, DO NOT CLOSE THIS WINDOW
        
8.  **JS**
        * Go to your notepad that has **widget.JS**
        * Select all text in the file
        * Copy the text to the clipboard
        * Go back to streamelements editor
        * In the JS tab, DELETE everything there
        * Right click inside the editor text field and select paste, DO NOT CLOSE THIS WINDOW
    
9.  **FIELDS**
        * Go to your notepad that has **widget.JSON**
        * Select all text in the file
        * Copy the text to the clipboard
        * Go back to streamelements editor
        * In the FIELDS tab, DELETE everything there
        * Right click inside the editor text field and select paste, Select DONE
        
10.  **SAVE**
        * Select SAVE at the top right corner
        
11. **Configure your settings**
    * Set your own image URL's for your locomotive, train cars, or smoke. There are hard coded defaults it will use if left blank.
    * All fields have hard coded defaults, so this will work out of the box after adding to your overlay.
    * Minimum Donations to start the train: 3
    * Cooldown: 60 minutes
    * Train Duration: 4 minutes
    * Smoke Base amount (per stage) 15 (increases smoke every $x donations)
    * Smoke threshold: 3 (increases smoke every x donations)
    * Donor name font size 14
    * Donation amount font size 16
    

### Support 

1. **GitHub** https://github.com/ksduster/Donation-Train/issues/new
2. **Discord** https://discord.gg/E6JdP5uXQv
            ** Support channel for issues with code, or help installing **