import streamlit as st
import requests
import time

# --- CONFIGURATION ---
st.set_page_config(page_title="Scorezle Bat Sizer", layout="centered")

# --- THE "CARD UI" CSS (The Magic Part) ---
st.markdown("""
    <style>
    /* 1. Main Background - Light Grey */
    .stApp {
        background-color: #f4f6f9;
    }
    
    /* 2. The White Card Container */
    .main .block-container {
        background-color: #ffffff;
        padding: 3rem;
        border-radius: 20px;
        box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
        max-width: 700px;
        margin-top: 50px;
    }

    /* 3. Headers & Text - Dark Green/Black */
    h1 {
        color: #0e2b24; 
        font-family: 'Arial', sans-serif;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    h3 {
        color: #8c9ba5;
        font-size: 14px;
        text-align: center;
        font-weight: 400;
        margin-bottom: 30px;
    }
    p, label {
        color: #333333;
    }

    /* 4. The Green Buttons */
    div.stButton > button {
        background-color: #009060; /* Scorezle Green */
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 50px; /* Pill shape */
        font-weight: bold;
        width: 100%;
        text-transform: uppercase;
        transition: all 0.3s;
    }
    div.stButton > button:hover {
        background-color: #00704a;
        transform: scale(1.02);
    }

    /* 5. Progress Bar - Green */
    .stProgress > div > div > div > div {
        background-color: #009060;
    }
    
    /* 6. Inputs */
    .stSelectbox, .stNumberInput, .stTextInput {
        border-radius: 10px;
    }
    </style>
""", unsafe_allow_html=True)

# --- MAILERLITE FUNCTION ---
def add_subscriber(email, sport, bat_result):
    url = "https://connect.mailerlite.com/api/subscribers"
    try:
        token = st.secrets["MAILERLITE_KEY"]
    except:
        token = "MISSING_KEY" 

    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
    payload = {
        "email": email,
        "groups": ["173526065051862853"], 
        "fields": {"sport": sport, "bat_recommendation": bat_result}
    }
    try:
        requests.post(url, json=payload, headers=headers)
    except:
        pass

# --- WIZARD LOGIC ---
if 'step' not in st.session_state: st.session_state.step = 1
if 'bat_result' not in st.session_state: st.session_state.bat_result = ""

def next_step(): st.session_state.step += 1
def restart(): st.session_state.step = 1

# --- HEADER ---
st.markdown("<h1>SCOREZLE <span style='color:#009060'>BAT SIZER</span></h1>", unsafe_allow_html=True)
st.markdown("<h3>PRECISION SIZING INSTRUMENT v2.0</h3>", unsafe_allow_html=True)

# --- STEPS ---

# STEP 1: SPORT
if st.session_state.step == 1:
    st.progress(25)
    st.write("### Select Sport")
    st.session_state.sport = st.selectbox("", ["Baseball", "Softball (Fastpitch)"])
    st.write("### League / Level")
    st.session_state.league = st.selectbox("", ["Little League / Rec (USA Bat)", "Travel Ball (USSSA)", "High School (BBCOR)"])
    
    st.write("")
    if st.button("NEXT STEP >"): next_step()

# STEP 2: MEASURE
elif st.session_state.step == 2:
    st.progress(50)
    st.write("### Player Stats")
    col1, col2 = st.columns(2)
    with col1: st.session_state.height = st.number_input("Height (Inches)", 40, 80, 54)
    with col2: st.session_state.weight = st.number_input("Weight (lbs)", 40, 250, 80)
    
    st.info("💡 **Pro Tip:** We use the Applied Vision algorithm for precision.")
    st.write("")
    if st.button("NEXT STEP >"): next_step()

# STEP 3: STRENGTH
elif st.session_state.step == 3:
    st.progress(75)
    st.write("### The Strength Lab")
    st.write("Have player hold a 2lb weight straight out for 20 seconds.")
    
    if st.button("⏱️ START TIMER"):
        with st.empty():
            for i in range(20, 0, -1):
                st.markdown(f"<h2 style='text-align:center; color:#009060'>{i}</h2>", unsafe_allow_html=True)
                time.sleep(1)
            st.balloons()
            st.success("Time's Up!")
            
    passed = st.radio("Did the arm shake?", ["No, it was easy", "Yes, they struggled"])
    
    if st.button("GET SCOUTING REPORT >"):
        # LOGIC
        h = st.session_state.height
        length = 26
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
            if passed == "Yes, they struggled" and drop == "-10": drop = "-11"
            
            st.session_state.rec_name = "Marucci Cat X"
            st.session_state.rec_img = "https://m.media-amazon.com/images/I/71R2J+d-ZlL._AC_SL1500_.jpg"
            st.session_state.link = "https://www.amazon.com/s?k=marucci+cat+x+baseball+bat"
        else:
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

# STEP 4: REPORT
elif st.session_state.step == 4:
    st.progress(100)
    st.write("### 🔒 Unlock Official Report")
    email = st.text_input("Enter Parent Email:")
    
    if st.button("REVEAL RESULTS"):
        if "@" not in email:
            st.error("Valid email required.")
        else:
            add_subscriber(email, st.session_state.sport, st.session_state.bat_result)
            
            st.markdown(f"""
            <div style="background-color:#f0fcf4; padding:20px; border-radius:10px; border:2px solid #009060; text-align:center;">
                <h2 style="color:#009060; margin:0;">TARGET: {st.session_state.bat_result}</h2>
            </div>
            """, unsafe_allow_html=True)
            
            st.write("")
            col1, col2 = st.columns([1,2])
            with col1: st.image(st.session_state.rec_img)
            with col2:
                st.write(f"**Best Match:** {st.session_state.rec_name}")
                st.link_button("👉 CHECK AMAZON PRICE", st.session_state.link)
            
            st.divider()
            st.write("You have the gear. Now get the card.")
            st.link_button("✨ CREATE SCOREZLE CARD", "https://scorezle.com")
            
            if st.button("START OVER"): restart()
