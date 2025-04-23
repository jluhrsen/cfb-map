# College Football Game Map

The initial purpose of this project is to quickly visualize the location of the
college football games that I'm interested in, in case there is a good opportunity
to travel and watch multiple games in the same vicinity. To start I've included
the teams of schools where I know some of the players on the team or am close to
people that attend or live near those schools.

## 🙌 How to Contribute (Add a New Team Schedule)

We’d love your help adding new teams! Here’s a simple way to contribute — no advanced experience required.

### ✅ Steps:

1. **Create a GitHub account**  
   If you don’t already have one, sign up at [github.com](https://github.com).

2. **Fork this repository**  
   Click the **“Fork”** button (top right) to make your own copy of the project.

3. **Clone your fork locally**  
   Open a terminal and run:
   ```
   git clone https://github.com/YOUR_USERNAME/cfb-map.git
   cd cfb-map
   ```

4. **Create a new schedule file**  
   Inside `src/schedules/`, copy one of the existing files like `wyoming.js` to a new file with your team’s name (e.g. `notredame.js`).

5. **Fill in your team’s schedule**  
   Use the same format and update:
    - `week`, `date`, `home`, `away`, `venue`
    - `homeLogo` and `awayLogo` using our shared `LOGOS` from `src/data/logos.js`  
      _(You can ask for help if you can’t find a logo!)_
    - if you don't know the venue location (latitude/longitude) or name, we can clean that up later, but AI (e.g., chatgpt) may be able to help you

6. **Update the index**  
   Add your team’s export to the bottom of `src/schedules/index.js`:
   ```
   export { Notre_Dame_GAMES } from './notredame';
   ```

7. **Commit your changes**
   ```
   git add .
   git commit -m "Add Notre Dame schedule"
   ```

8. **Push your fork**
   ```
   git push
   ```

9. **Create a Pull Request**  
   Go to your fork on GitHub and click **“Compare & pull request”**.  
   Add a short message and submit — we’ll review it and merge it in!

---

💬 Need help? Open an [Issue](https://github.com/jluhrsen/cfb-map/issues) or reach out — we’re happy to walk you through it.
