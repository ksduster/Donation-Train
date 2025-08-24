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
| `avatarSize`             | Pixel size for donor avatars.                                           |
| `nameFontPx`             | Font size for donor names.                                              |
| `smokeBaseAmount`        | Base number of smoke puffs per emission.                                |
| `smokeDonationThreshold` | Donations or amount threshold per smoke stage (affects puff intensity). |

### Summary

The **Donation Train widget** provides a dynamic, visual way to reward and recognize donors in real-time. It ensures that donor activity is celebrated collectively, with a fun animated train and adaptive smoke effects that visually reflect the generosity of the community.

