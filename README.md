# Garden Planner Guide

## Top Toolbar Features

- **SYNC Button**: Synchronizes your local plant list with the database.
- **Help Button**: Reveals keybindings for navigation.

## Keybindings

- **Zoom In/Out/Reset**: `+`/`-`/`Space`
- **Camera Move**: Middle Mouse Drag
- **Delete**: Right Click (Deletes the current session without confirmation)

## Creating Your Garden

- Select your measurement unit.
- Shape your garden with "+ Points"; adjust with vertexes.
- Finish shaping with "- Points".
- Select a Point of the shape to define where the next point should go.
- Save garden configurations and location data for shadow mapping.

## Saving and Loading Gardens

- Click the eye icon for bottom toolbar; save with the disk icon.
- Download JSON backups with the download button.
- Delete sessions with the trash icon.
- Load previous gardens or JSON files with the folder icon.

## Planting and Plot Measurements

- Add plot measurements or start planting.
- Choose a plant role and select plants.
- Submit new plants for database inclusion.

## Plant Configuration and Shadow Mapping

- Customize plant stature.
- Include plants in nutrient calculations with "Nutrient Calc".
- Generate annual shadow maps using "Calc Shadows".

## Defining and Utilizing Location Data

- Save your garden, then access the "Location Data" button.
- Select "Select Location" to define your plot’s coordinates.
- Retrieve climate data using the "Get Location Data" button.
- Analyze data through line graphs with interactive tooltips.

**Build and visualize your garden**





Garden Planner


On The top Toolbar there should be a SYNC Button, this button syncs your local plant list with the growing database of defined plants. 

The Help Button shows the various Keybinds:

Zoom In/Out/Reset: +/-/Space

Camera Move: Middle Mouse Drag

Delete: Right Click

Zoom in to select easier


How to Make a Garden:

On the Toolbar select your perferred measurment unit (The application uses metric, but dimensions are converted on the fly).

Before you can place a plant you need to shape your garden space, by selecting "+ Points" you're able to outline your garden space by clicking. Drag the vertexes to reshape your garden. Select a point to highlight the following edge with yellow. The yellow line indicates the edge the next vertex will break.  

Once you're done shaping your garden, select the "- Points" button to stop editing the gardens shape.

Saving, select the eye Icon on the bottom left to see the bottom toolbar. Next to the eye is a 3 point menuy button, select that to see the save icon, hit save to locally save your garden.
Add a name to your Save file to easily distinguish it from your other designs.

You can always download your save data as a JSON file to back up as you wish, the download button is next to the save icon (3rd from the left).

The left most button deletes your current saved session, please be careful as there is no comfirmation yet. 

To Load a saved file select the 4th button from the save menu. A modal with your saves should pop up, here you can easily import your json file from other saves. 

Once your garden is saved we can start measuring out the plots. Once the bottom toolbar is visible select the Add Plot button. Similarly to how the larger garden space was outlined, these smaller grow beds are created, they can even be named. 

Once your done adding your various plots (or skip that if your more freeform) we can start planting. From the top toolbar select the Role your planting for, currently the availalbe roles are: 

- Canopy
- Understory
- Shrub
- Vertical
- Herbaceous
- Rhizosphere
- Ground Cover

Some plants might be present across multiple roles, or might have varieties or cultivars that are in differnt roles form the main plant. 

Once the Role is selected the available plants for that role are shown next to it. If the plant you want isn't present on any of the lists, select New Plant in the toolbar and submit one for consideration, it might take a while but it will be considered for adding into the main database. For the plants that are present once your select the plant a info/Plant Config button should be present. Currently only the plants matching the currently selected role is rendered, but in the future this will be customizable. 

info/Plant COnfig button: 
That button opens a modal that allows the user to customaize the physical stature of that specific plant within the plants within a given range. At the bottom of the modal are two buttons, Nutrient Calc and Calc SHadows. The application tries to calculate the rough Nitrogen and Potassium requirement for your garden, if you want the plant that you place to not be included in this calculation then keep the button in its default state, to include the plant in the calulation seelect the Include in Nutrient Calc button. The CalC Shadows button creates a annual shadow map of that plant from its given height and the location of your gardn. This is usefull for planning our garden plots relative to shade trees or windbreaks. For this a location must be defined.

Defining a location:

For certain functionality such as shadow maps and climate data a coordinate location can be defined. Once you have saved your current session at least once, the save menu should have a Location Data button present

Location Data button:

Once selected a Modal pops up, hit Select Location to define the position of the plot. The application is designed and tested for Canada, but you can define any location by scrolling and clicking (though caution when choosing the southern hemisphere as that hasn't been tested yet).

Once a location is selected 1 more button should be present, Get Location Data button

Get Location Data button: 
Once selected the climate and almnac data for the selected location is retrieved(this can take up to 1 minute, please be patient). Once the data is recieved a select box is shown where you can choose which information you want to see. The nearest airport from your location is used for the weatherstation data, though in the future choosing the weather stations to allow more granularity will be added. 

Save your garden once a location is present for the shadow map calculations. 

The charts are simple line graphs, (will be displaying== Wind rose data eventually), the darker region is where the user can mouse over to select the data. A legend is present at the top once the user mouses over the data showing the selecte data point. 

With location data, now when plants are placed their shadow maps are displayed (Select the shadow button in the bottom toolbar to prevent them from rendering). The Blue polygon is the winter solstice, the yellow is the spring / fall equinox and the red is the summer solstice. 




I'm excited to share a personal project of mine: My Garden Model. It's a homegrown, local-first gardening app that doesn't require an account, making it accessible for anyone interested in planning their garden or orchard spaces, particularly in temperate climates where understanding light and shadow is crucial for a shorter growing season.

My Garden Model is a gardening app designed for planned and sustainable cultivation. It assists in visualizing top down, layered garden layouts, calculating plant-specific nutritional needs, and assessing light requirements through shadow mapping. Geared especially for temperate climates with shorter growing seasons, it facilitates a balanced approach to garden and orchard planning, ensuring better space planning and utilization.
Note: For N and K calculations I use the simplified categories that Martin Crawford shows in his book Creating a forest garden 

This is a part-time labor of love that I hope to evolve over time, adding features and plant data based on community feedback and submissions. I've used it for my backyard garden, and it's made a significant difference in planning and planting.

Plant submissions from gardeners are welcome and incredibly valuable. They'll help grow the plant database, which I plan to make publicly available for anyone to use (you already technically store a shadow copy of it in the your save file, so the data is already free to use).

I don't want to overstate an otherwise free tool, its very bare bones, the ui is horrible, and there will almost certainly be bugs, and crashes, proceed with caution as this is very much an alpha. 

Strengths:

No account needed, ensuring it remains low-cost and local.
Localized data, since you can define the coordinates of the garden, the fetched climate data is already local to you (well as local as your nearest airport is, I will eventually allow users to select their won weather stations for more specific data). Also localized in the sense that your save files and the data you input (barring the feedback and plant submissions) stays in your browser, this also helps lower my server costs.
Helps balance plant nutrition by calculating nitrogen and potassium needs.
Allows for visualizing for light and space requirements, easier to plan out structure or growing bed placement that might need to harvest or avoid sunlight during certain seasons. 
At scale planning, you can design a garden thats' cms wide or hectares wide. The plants' canopies and shadows will be rendered to scale and (if in the northern hemisphere) directionally accurate.
Have the rough implementation for yield modeling (will be fully added later) 

Limitations:

Horrendous UI, no Mobile support, this is purely a desktop application, please do not use mobile to view the site as that hasn't been tested and last time I tried it was a mess. 
Designed for personal use, so features will be added gradually and when I can.
Plant database submissions and feature requests are processed as time allows.
No support for fauna integration to define pests or helpers (yet)
No support for mycelium  (in the plans but far off)
No support for soil tests (in the plans) currently assumes your growing in nearly sterile soils, will eventually allow users to keep track of various soil metrics to track longer term characteristics. 
As a test case, you can map out an orchard, ensuring trees have adequate space, receive sufficient light, and soil nutrition is maintained. For instance, if you're planting apple trees with a nitrogen-fixing ground cover like clover, or an Alder tree, My Garden Model can help you visualize the layout needed for a close loop (or as close to closed loop as we can get) nutrient flow. The amount of light a nitrogen fixer gets, greatly affects its nitrogen output, currently the software assumes everything is in full light, but with the recent addition of the shadow maps, I will eventually scale the nitorgen output based on the actual light available. 

If your interested, visit the site at garden.2many.ca 

Here is a better write up and a rambling quick start guide (https://pastebin.com/mazMYWMw)

About me: I'm a backend software developer by trade, whose been growing plants and keeping small animals in a cold climate for about 4-5 years now. Knowing the wealth of experience in these kinds of subs I know I've barely scratched the surface so any input would be greatly appreciated.  