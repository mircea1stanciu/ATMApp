# 🧪 Team Messaging - Testing Guide

Quick guide to manually test all Team Messaging features.

---

## 🚀 Setup

### Prerequisites
- Backend running on `http://localhost:8002`
- Frontend running on `http://localhost:3003`
- At least 2 test users in the same organization

### Test Users (from your setup)
- **Super Admin**: `admin` / `admin123`
- **Org Admin**: `raiffeisen_admin` / `admin123` (org: raiffeisen)
- **Regular User**: `john_qa_raiffeisen` / `admin123` (org: raiffeisen)

---

## 📝 Test Scenarios

### Test 1: Basic Messaging (1-on-1)

**Time**: 5 minutes

1. **Browser 1**: Login as `admin`
2. **Browser 2**: Login as `raiffeisen_admin`
3. **Browser 1**: 
   - Click "Messenger" tab in chat sidebar
   - Search for "raiffeisen"
   - Click on "raiffeisen_admin" to start conversation
4. **Browser 1**: Type "Hello from admin!" and send
5. **Browser 2**: 
   - Click "Messenger" tab
   - Should see conversation appear
   - Should see message in real-time
6. **Browser 2**: Reply with "Hi admin!"
7. **Browser 1**: Should see reply appear instantly

**Expected Results**:
- ✅ Messages appear in real-time
- ✅ No page refresh needed
- ✅ Conversation shows in both browsers
- ✅ Messages correctly attributed to senders

---

### Test 2: File Attachments

**Time**: 5 minutes

**Using same conversation from Test 1:**

1. **Browser 1**:
   - Click the 📎 attachment button
   - Select an image file (JPG/PNG)
   - Should see image preview appear
   - Type "Check out this image"
   - Click Send
2. **Browser 2**:
   - Should see message with file attachment
   - Click download icon
   - File should download

3. **Browser 1**:
   - Try drag-and-drop:
   - Drag a PDF file onto the message input area
   - Area should highlight in blue
   - Drop the file
   - Should see file preview
   - Click Send
4. **Browser 2**:
   - Should see PDF attachment
   - Click to download

**Expected Results**:
- ✅ Image preview shows before sending
- ✅ Drag-drop visual feedback works
- ✅ Files appear in messages
- ✅ Files can be downloaded
- ✅ 10MB limit enforced (test with large file)

---

### Test 3: Message Reactions

**Time**: 3 minutes

**Using same conversation:**

1. **Browser 1**:
   - Hover over a message from raiffeisen_admin
   - Should see 6 emoji buttons appear: 👍 ❤️ 😂 😮 😢 😠
   - Click the 👍 emoji
   - Should see reaction appear below message with count "1"
2. **Browser 2**:
   - Should see the 👍 reaction appear in real-time
   - Hover over the same message
   - Click ❤️ emoji
3. **Browser 1**:
   - Should see ❤️ reaction added (count: 1)
   - Hover over 👍 reaction
   - Should show tooltip "admin" (your username)
4. **Browser 1**:
   - Click 👍 again
   - Should toggle off (reaction removed)
5. **Browser 2**:
   - Should see 👍 reaction disappear
   - Only ❤️ remains

**Expected Results**:
- ✅ Reactions appear on hover
- ✅ Reactions update in real-time
- ✅ Counts increment correctly
- ✅ Tooltip shows who reacted
- ✅ Toggling own reaction works
- ✅ Visual distinction for own reactions

---

### Test 4: Group Conversations

**Time**: 5 minutes

1. **Browser 1** (admin):
   - Click "Users" tab in messenger
   - Should see list of organization users
   - Select "Create Group" button (or similar)
   - Select 2+ users
   - Enter group name: "Test Group"
   - Click Create
2. **Browser 2** & **Browser 3**:
   - Should see "Test Group" appear in conversations
3. **Browser 1**:
   - Select "Test Group"
   - Send message: "Welcome to the group!"
4. **All browsers**:
   - Should see message appear
5. **Browser 2**:
   - Reply in group: "Thanks!"
6. **All browsers**:
   - Should see reply

**Expected Results**:
- ✅ Group created successfully
- ✅ All members see the group
- ✅ Messages broadcast to all members
- ✅ Group name displayed correctly
- ✅ Member count shown (e.g., "3 members")

---

### Test 5: User Search & Organization Users

**Time**: 3 minutes

1. **Browser 1**:
   - In Messenger, click "Users" tab
   - Should see all users in organization
   - Type "john" in search bar
2. Should filter to show only "john_qa_raiffeisen"
3. Click on john to start conversation
4. Send message
5. Clear search
6. Should see full users list again

**Expected Results**:
- ✅ Users list populates
- ✅ Search filters correctly
- ✅ Can start conversation from users list
- ✅ Online/offline status shown (if implemented)

---

### Test 6: WebSocket Reconnection

**Time**: 3 minutes

1. **Browser 1**: Open Developer Tools (F12)
2. Go to Network tab
3. Filter for "WS" (WebSocket)
4. Should see WebSocket connection established
5. In terminal, restart the backend server
6. Wait 3-5 seconds
7. Should see WebSocket reconnect automatically
8. Send a message to verify it works

**Expected Results**:
- ✅ WebSocket connects on load
- ✅ Reconnects after disconnect
- ✅ Messages still send after reconnection
- ✅ No data loss

---

### Test 7: Large Message Volume

**Time**: 5 minutes

1. **Browser 1**:
   - Send 20+ messages rapidly
   - Mix of text and files
2. Scroll up and down
3. Should see all messages
4. No performance issues
5. Messages in correct order

**Expected Results**:
- ✅ All messages appear
- ✅ Correct chronological order
- ✅ No lag or freezing
- ✅ Scroll works smoothly
- ✅ Auto-scroll to bottom on new message

---

### Test 8: File Upload Limits

**Time**: 5 minutes

**Test file size limit:**
1. Try to upload file > 10MB
   - Should see error message
   - Should not upload

**Test file type validation:**
2. Try to upload .exe or .bat file
   - Should see error or rejection

**Test multiple files:**
3. Upload image
4. Upload document
5. Upload video
6. All should work

**Expected Results**:
- ✅ 10MB limit enforced
- ✅ Invalid file types rejected
- ✅ Valid files upload successfully
- ✅ Error messages clear and helpful

---

### Test 9: Dark Mode

**Time**: 2 minutes

1. Toggle dark mode in application
2. Check messenger interface:
   - Sidebar colors correct
   - Message bubbles readable
   - Input area visible
   - Reactions visible
   - File previews visible
3. Toggle back to light mode
4. Everything should look good

**Expected Results**:
- ✅ Dark mode fully supported
- ✅ All text readable
- ✅ Proper contrast
- ✅ No white flashes
- ✅ Consistent styling

---

### Test 10: Mobile Responsiveness

**Time**: 3 minutes

1. Resize browser to mobile width (400px)
2. Messenger should remain usable
3. Sidebar should work
4. Messages readable
5. Can send messages
6. File upload works
7. Reactions work

**Expected Results**:
- ✅ Layout adapts to mobile
- ✅ No horizontal scroll
- ✅ All features accessible
- ✅ Touch interactions work

---

## 🐛 Bug Report Template

If you find issues, document them like this:

```
**Bug**: [Short description]
**Severity**: Critical / High / Medium / Low
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happened]
**Browser**: Chrome/Firefox/Safari
**Screenshot**: [Attach if applicable]
```

---

## ✅ Test Results Checklist

After completing all tests, check off:

### Core Functionality
- [ ] Basic messaging (1-on-1)
- [ ] Group conversations
- [ ] Real-time updates
- [ ] Message ordering correct

### File Attachments
- [ ] File upload via button
- [ ] Drag-and-drop works
- [ ] Image previews
- [ ] File download
- [ ] Size limit enforced
- [ ] Type validation works

### Message Reactions
- [ ] Quick reactions appear on hover
- [ ] Reactions add/remove
- [ ] Real-time reaction updates
- [ ] Reaction counts correct
- [ ] Tooltip shows users
- [ ] Visual distinction for own reactions

### User Management
- [ ] User search works
- [ ] Organization users list
- [ ] Start conversation from search
- [ ] Online/offline status (if implemented)

### Performance & Reliability
- [ ] WebSocket reconnection
- [ ] Large message volume
- [ ] No memory leaks
- [ ] Smooth scrolling

### UI/UX
- [ ] Dark mode support
- [ ] Mobile responsiveness
- [ ] Loading states
- [ ] Error messages
- [ ] Empty states

### Edge Cases
- [ ] File size limit
- [ ] File type validation
- [ ] Network disconnect/reconnect
- [ ] Multiple tabs open
- [ ] Browser refresh maintains session

---

## 📊 Test Summary

**Total Tests**: 10  
**Estimated Time**: 35-40 minutes  
**Prerequisites**: 2-3 browsers or Incognito windows  

---

## 🎯 Success Criteria

All tests should pass with:
- ✅ No critical bugs
- ✅ No data loss
- ✅ Real-time updates working
- ✅ All features functional
- ✅ Good user experience

---

## 📝 Notes

- Test with different browsers (Chrome, Firefox, Safari)
- Test on different devices (Desktop, Tablet, Mobile)
- Monitor browser console for errors
- Monitor network tab for failed requests
- Check backend logs for errors

---

## 🚀 After Testing

Once all tests pass:
1. Document any bugs found
2. Fix critical issues
3. Re-test affected areas
4. Get approval for production deployment
5. Deploy!

---

**Happy Testing!** 🎉
