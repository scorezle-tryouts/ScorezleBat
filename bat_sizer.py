import streamlit as st
import requests
import time

# --- CONFIGURATION (Dark Mode & Title) ---
st.set_page_config(page_title="The Scorezle Bat Lab", layout="centered")

# Custom CSS for Dark Mode & Button Styling
st.markdown("""
    <style>
    .stApp {
        background-color: #0e1117;
        color: white;
    }
    div.stButton > button {
        width: 100%;
        background-color: #FF4B4B;
        color: white;
        font-size: 18px;
        font-weight: bold;
        border-radius: 10px;
        padding: 10px;
    }
    div.stButton > button:hover {
        background-color: #FF0000;
        color: white;
    }
    /* Progress Bar Color */
    .stProgress > div > div > div > div {
        background-color: #FFD700;
    }
    </style>
""", unsafe_allow_html=True)

# --- MAILERLITE FUNCTION ---
def add_subscriber(email, sport, bat_result):
    url = "https://connect.mailerlite.com/api/subscribers"
    try:
        token = st.secrets["MAILERLITE_KEY"]
    except:
        token = "MISSING_KEY" # Handle local testing

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    payload = {
        "email": email,
        "groups": ["173526065051862853"], # Your Bat Sizer Group ID
        "fields": {
            "sport": sport,
            "bat_recommendation": bat_result
        }
    }
    
    try:
        requests.post(url, json=payload, headers=headers)
    except:
        pass

# --- SESSION STATE (The Wizard Logic) ---
if 'step' not in st.session_state:
    st.session_state.step = 1
if 'bat_result' not in st.session_state:
    st.session_state.bat_result = ""

def next_step():
    st.session_state.step += 1

def restart():
    st.session_state.step = 1

# --- STEP 1: SPORT & LEAGUE ---
if st.session_state.step == 1:
    st.title("⚾ The Scorezle Bat Lab")
    st.progress(25)
    st.subheader("Step 1: The Legal Check")
    
    col1, col2 = st.columns(2)
    with col1:
        st.session_state.sport = st.selectbox("Sport", ["Baseball", "Softball (Fastpitch)"])
    with col2:
        st.session_state.league = st.selectbox("League", ["Little League (USA)", "Travel Ball (USSSA)", "High School (BBCOR)"])
        
    st.write("")
    st.write("")
    if st.button("Next: Measurements ➡️"):
        next_step()

# --- STEP 2: MEASUREMENTS ---
elif st.session_state.step == 2:
    st.title("📏 Precision Fit")
    st.progress(50)
    st.subheader("Step 2: Player Stats")
    
    col1, col2 = st.columns(2)
    with col1:
        st.session_state.height = st.number_input("Height (Inches)", 40, 80, 54)
    with col2:
        st.session_state.weight = st.number_input("Weight (lbs)", 40, 250, 80)

    st.info("💡 **Pro Tip:** We use a pro algorithm based on height/weight ratio.")
    
    st.write("")
    if st.button("Next: Strength Lab ➡️"):
        next_step()

# --- STEP 3: THE HOLD TEST ---
elif st.session_state.step == 3:
    st.title("💪 The Strength Lab")
    st.progress(75)
    st.subheader("Step 3: The 20-Second Challenge")
    
    st.write("Have the player hold a **2lb weight** (or water bottle) straight out to the side.")
    
    if st.button("⏱️ Start Timer"):
        with st.empty():
            for i in range(20, 0, -1):
                st.markdown(f"# ⏳ {i}")
                time.sleep(1)
            st.markdown("# ✅ TIME UP!")
            st.balloons()
            
    st.write("Did their arm shake or drop?")
    passed = st.radio("Result:", ["No, it was easy", "Yes, they struggled"])
    
    if st.button("Next: Get Scouting Report ➡️"):
        # CALCULATE LOGIC HERE
        length = 26
        h = st.session_state.height
        if st.session_state.sport == "Baseball":
            if h > 40: length = 27
            if h > 44: length = 28
            if h > 48: length = 29
            if h > 52: length = 30
            if h > 56: length = 31
            if h > 60: length = 32
            
            drop = "-10"
            if st.session_state.league == "High School (BBCOR)": drop = "-3"
            elif st.session_state.weight > 110: drop = "-8"
            
            # Strength Adjustment
            if passed == "Yes, they struggled" and drop == "-10":
                drop = "-11 (Lighter)"
                
            st.session_state.rec_name = "Marucci Cat X"
            st.session_state.rec_img = "https://m.media-amazon.com/images/I/71R2J+d-ZlL._AC_SL1500_.jpg"
            st.session_state.link = "https://www.amazon.com/s?k=marucci+cat+x+baseball+bat"
            
        else:
            # Softball
            if h > 48: length = 29
            if h > 52: length = 30
            if h > 56: length = 31
            if h > 60: length = 32
            drop = "-10"
            
            st.session_state.rec_name = "Easton Ghost"
            st.session_state.rec_img = "https://m.media-amazon.com/images/I/61bV2+D-ZlL._AC_SL1500_.jpg"
            st.session_state.link = "https://www.amazon.com/s?k=easton+ghost+softball+bat"

        st.session_state.bat_result = f"{length}-inch // {drop} Drop"
        next_step()

# --- STEP 4: THE GATE & REPORT ---
elif st.session_state.step == 4:
    st.title("🏆 Official Report")
    st.progress(100)
    
    st.markdown("### 🔒 Unlock Your Specs")
    email = st.text_input("Enter Parent Email to reveal results:")
    st.caption("We respect privacy. Unsubscribe anytime.")
    
    if st.button("🚀 REVEAL RESULTS"):
        if "@" not in email:
            st.error("Please enter a valid email.")
        else:
            # Send to MailerLite
            add_subscriber(email, st.session_state.sport, st.session_state.bat_result)
            
            # SHOW THE CARD
            st.success(f"Report Sent to {email}")
            
            st.markdown(f"""
            <div style="background-color: #1E1E1E; padding: 20px; border-radius: 10px; border: 2px solid #FFD700;">
                <h1 style="color: #FFD700; text-align: center;">TARGET: {st.session_state.bat_result}</h1>
            </div>
            """, unsafe_allow_html=True)
            
            col1, col2 = st.columns([1, 2])
            with col1:
                st.image(st.session_state.rec_img)
            with col2:
                st.subheader(f"Recommended: {st.session_state.rec_name}")
                st.write("Rated #1 for this size profile.")
                st.link_button("👉 Check Price on Amazon", st.session_state.link)
            
            st.divider()
            st.markdown("### 🌟 Next Step")
            st.write("You have the gear. Now get the card.")
            st.link_button("✨ Create Scorezle Card", "https://scorezle.com")
            
            if st.button("Start Over"):
                restart()
