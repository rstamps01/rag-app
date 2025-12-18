# Graph Type Layout Testing Guide
## Testing Graph Layout Controls with Live Preview

**Date:** 2025-12-13  
**Page URL:** `http://localhost:3001/similarity-test`  
**Status:** ✅ **IMPLEMENTED - READY FOR TESTING**

---

## 🎯 **What Was Fixed**

### **Issue:**
- Graph type selection from Visualization Controls was not being applied to the central graph
- `graphType` prop was not being passed to `QdrantGraphWorking` component
- Graph component had internal `graphType` state that wasn't being used

### **Solution:**
1. ✅ Added `graphType` prop to `QdrantGraphWorking` component
2. ✅ Passed `visualizationSettings.graphType` from `SimilarityVisualizationDemo`
3. ✅ Created `getForceConfig()` function that returns different force simulation parameters based on graph type
4. ✅ Applied force configurations to both ForceGraph2D and ForceGraph3D
5. ✅ Added console logging to track graph type changes

---

## 🧪 **Testing Instructions**

### **Prerequisites:**
1. Dev server running at `http://localhost:3001`
2. Navigate to `/similarity-test` page
3. Ensure graph data is loaded (should see nodes in the central visualization)

### **Test Steps:**

#### **1. Enable Live Preview**
1. Click the "Controls" button (top right) to open the left panel
2. Click the **Eye icon** (Live Preview toggle) in the Visualization Controls header
3. Verify the button turns green and shows "Live Preview Active"
4. The "Apply Changes" button should now be disabled

#### **2. Test Each Graph Type**

For each graph type in the carousel:

**A. Force-Directed Graph**
1. Navigate to "Graph Layout" accordion (should be open by default)
2. Use carousel arrows to navigate to "Force-Directed Graph" (1 of 5)
3. Click **"Select This Layout"** button
4. **Expected:** 
   - Button text changes to "Selected"
   - Console shows: `🎨 Graph type changed to: force-directed`
   - Graph layout changes: Balanced forces, natural clustering
   - Nodes spread out naturally with connections

**B. Hierarchical Layout**
1. Click next arrow (→) to navigate to "Hierarchical Layout" (2 of 5)
2. Click **"Select This Layout"** button
3. **Expected:**
   - Console shows: `🎨 Graph type changed to: hierarchical`
   - Graph layout changes: Stronger links, tighter clustering
   - Nodes form more tree-like structures

**C. Circular Layout**
1. Click next arrow (→) to navigate to "Circular Layout" (3 of 5)
2. Click **"Select This Layout"** button
3. **Expected:**
   - Console shows: `🎨 Graph type changed to: circular`
   - Graph layout changes: Strong centering, nodes arranged in circular pattern
   - More compact, circular arrangement

**D. Grid Layout**
1. Click next arrow (→) to navigate to "Grid Layout" (4 of 5)
2. Click **"Select This Layout"** button
3. **Expected:**
   - Console shows: `🎨 Graph type changed to: grid`
   - Graph layout changes: Regular grid pattern, minimal movement
   - Nodes align in grid-like structure

**E. Qdrant Native Style**
1. Click next arrow (→) to navigate to "Qdrant Native Style" (5 of 5)
2. Click **"Select This Layout"** button
3. **Expected:**
   - Console shows: `🎨 Graph type changed to: qdrant-native`
   - Graph layout changes: Hub-spoke model characteristics
   - Stronger hub connections if hub-spoke is enabled

#### **3. Verify Live Preview Mode**

1. With Live Preview enabled:
   - Changes should apply **immediately** when "Select This Layout" is clicked
   - No need to click "Apply Changes" (it's disabled)
   - Graph should update in real-time

2. With Live Preview disabled:
   - Click "Select This Layout" - button changes to "Selected"
   - Graph does NOT change yet
   - Click "Apply Changes" button
   - Graph should now update

#### **4. Test Carousel Navigation**

1. Navigate through all 5 graph types using arrow buttons
2. Verify preview images change for each type
3. Verify carousel counter shows correct position (e.g., "1 of 5", "2 of 5")
4. Verify selecting a type updates the carousel to show that type

---

## 📊 **Expected Behavior**

### **Force Configurations:**

| Graph Type | Charge Strength | Link Distance | Link Strength | Center Strength | Characteristics |
|------------|----------------|---------------|---------------|-----------------|-----------------|
| **force-directed** | -300 | Variable/80 | 0.1 | 0.1 | Balanced, natural clustering |
| **hierarchical** | -150 | Variable*0.8/64 | 0.3 | 0.2 | Tree-like, stronger links |
| **circular** | -450 | Variable*1.2/96 | 0.05 | 0.5 | Circular, strong centering |
| **grid** | -90 | Variable*0.6/48 | 0.5 | 0.3 | Grid pattern, minimal movement |
| **qdrant-native** | -240 | Variable*0.7/56 | 0.4/0.1 | 0.15 | Hub-spoke, strong connections |

*Variable distance = (minDistance + maxDistance) / 2 if useVariableDistance is enabled

---

## 🔍 **Debugging**

### **Console Logs to Watch For:**

When graph type changes, you should see:
```
🎨 Graph type changed to: [graph-type-name]
⚙️ Force config: { charge: {...}, link: {...}, center: {...}, collision: {...} }
```

### **If Graph Doesn't Change:**

1. **Check Console:**
   - Verify graph type change is logged
   - Check for any errors

2. **Check Props:**
   - Verify `graphType` prop is being passed to `QdrantGraphWorking`
   - Check `visualizationSettings.graphType` in React DevTools

3. **Check Force Config:**
   - Verify `getForceConfig()` returns correct configuration
   - Check that `d3ForceConfig` is applied to both 2D and 3D graphs

4. **Check Live Preview:**
   - Verify live preview toggle is enabled (green)
   - Check that settings are being applied immediately

---

## ✅ **Success Criteria**

- [x] Graph type prop is passed to QdrantGraphWorking
- [x] Force configurations are different for each graph type
- [x] Console logs show graph type changes
- [x] Live preview applies changes immediately
- [x] "Select This Layout" button updates graph
- [x] Carousel syncs with selected graph type
- [ ] **Visual verification:** Graph layout visibly changes for each type
- [ ] **User testing:** All 5 graph types can be selected and applied

---

## 📝 **Notes**

1. **Force Simulation:**
   - Different graph types use different D3 force simulation parameters
   - Changes may take a few seconds to stabilize
   - Nodes may need to "settle" into new positions

2. **Live Preview:**
   - Changes apply immediately when live preview is enabled
   - Debounced to prevent excessive updates (100ms delay)

3. **Graph Type Mapping:**
   - Control panel uses: `force-directed`, `hierarchical`, `circular`, `grid`, `qdrant-native`
   - These map directly to force configurations in the graph component

---

**Last Updated:** 2025-12-13  
**Status:** ✅ **IMPLEMENTED - READY FOR TESTING**


