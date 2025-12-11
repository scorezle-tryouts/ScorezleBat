import streamlit as st
import requests
import time

# --- CONFIGURATION ---
st.set_page_config(page_title="Scorezle Bat Sizer", layout="centered")

# --- MODERN UI CSS (The "2025" Look) ---
st.markdown("""
    <style>
    /* 1. Global Clean Background */
    .stApp {
        background-color: #f8f9fa;
        font-family: 'Helvetica Neue', sans-serif;
    }
    
    /* 2. The Main "White Card" */
    .block-container {
        background-color: white;
        padding: 3rem;
        border-radius: 25px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        margin-top: 2rem;
        max-width: 700px;
    }

    /* 3. Modern Inputs (Rounded & Clean) */
    .stSelectbox div[data-baseweb="select"] > div,
    .stNumberInput input, 
    .stTextInput input {
        border-radius: 12px !important;
        border: 1px solid #e0e0e0;
        padding: 10px;
        background-color: #ffffff;
        color: #333;
    }

    /* 4. Scorezle Green Buttons */
    div.stButton > button {
        background-color: #009060;
        color: white;
        border: none;
        padding: 16px 32px;
        font-size: 16px;
        font-weight: 700;
        border-radius: 50px;
        width: 100%;
        box-shadow: 0 4px 15px rgba(0, 144, 96, 0.3);
        transition: all 0.2s ease-in-out;
    }
    div.stButton > button:hover {
        background-color: #00704a;
        transform: translateY(-2px);
    }

    /* 5. Headers */
    h1 { color: #1a1a1a; font-weight: 800; letter-spacing: -1px; }
    h2 { color: #333; font-size: 20px; margin-top: 0; }
    p { color: #666; font-size: 16px; }
    
    /* 6. Hide default Streamlit junk */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    </style>
""", unsafe_allow_html=True)

# --- MAILERLITE FUNCTION ---
def add_subscriber(email, sport, bat_result):
    url = "https://connect.mailerlite.com/api/subscribers"
    try:
        token = st.secrets["MAILERLITE_KEY"]
    except:
        token = "MISSING" 

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

# --- HEADER (Modern Centered) ---
col1, col2, col3 = st.columns([1,5,1])
with col2:
    st.markdown("<h1 style='text-align: center;'>THE BAT LAB</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color: #009060; font-weight: bold;'>PRECISION SIZING INSTRUMENT</p>", unsafe_allow_html=True)
    st.divider()

# --- STEP 1: SPORT & LEAGUE ---
if st.session_state.step == 1:
    st.markdown("## 1. The Basics")
    
    st.session_state.sport = st.selectbox("Select Sport", ["Baseball", "Softball (Fastpitch)"])
    
    # ADDED T-BALL HERE
    st.session_state.league = st.selectbox("League / Level", [
        "T-Ball (Ages 4-6)", 
        "Little League / Rec (USA Bat)", 
        "Travel Ball (USSSA)", 
        "High School (BBCOR)"
    ])
    
    st.write("")
    if st.button("Continue to Measurements ➡️", type="primary"): next_step()

# --- STEP 2: MEASUREMENTS (Restored Age/Wingspan) ---
elif st.session_state.step == 2:
    st.markdown("## 2. Pro Body Stats")
    
    col1, col2 = st.columns(2)
    with col1:
        st.session_state.age = st.number_input("Age", 4, 18, 9)
        st.session_state.height = st.number_input("Height (Inches)", 30, 80, 50)
    with col2:
        st.session_state.weight = st.number_input("Weight (lbs)", 30, 250, 70)
        # ADDED WINGSPAN HERE
        st.session_state.wingspan = st.number_input("Wingspan (Center Chest to Fingertip)", 20, 40, 28)

    st.info("💡 **Why Wingspan?** It is 3x more accurate than height alone for bat coverage.")
    
    st.write("")
    if st.button("Continue to Strength Lab ➡️", type="primary"): next_step()

# --- STEP 3: STRENGTH ---
elif st.session_state.step == 3:
    st.markdown("## 3. The Hold Test")
    st.write("Have the player hold a **2lb weight** (water bottle) straight out to the side.")
    
    if st.button("⏱️ Start 20-Second Timer"):
        progress_text = "Hold Steady..."
        my_bar = st.progress(0, text=progress_text)
        for percent_complete in range(100):
            time.sleep(0.2)
            my_bar.progress(percent_complete + 1, text=progress_text)
        st.success("Time's Up!")
            
    passed = st.radio("Did the arm shake?", ["No, it was easy", "Yes, they struggled"])
    
    st.write("")
    if st.button("Generate Official Report ➡️", type="primary"):
        # LOGIC ENGINE
        length = 26
        # Use Wingspan as primary driver if available
        if st.session_state.wingspan > 0:
            length = int(st.session_state.wingspan)
        else:
            # Fallback to Height
            h = st.session_state.height
            if h > 40: length = 27
            if h > 44: length = 28
            if h > 48: length = 29
            if h > 52: length = 30
            if h > 56: length = 31
            if h > 60: length = 32

        # T-Ball Override
        if st.session_state.league == "T-Ball (Ages 4-6)":
            length = 25
            drop = "-12 (T-Ball)"
            st.session_state.rec_name = "Easton ADV T-Ball"
            st.session_state.link = "https://www.amazon.com/s?k=easton+tball+bat"
            st.session_state.rec_img = "https://m.media-amazon.com/images/I/51p8w-hYtAL._AC_SL1200_.jpg"

        elif st.session_state.sport == "Baseball":
            drop = "-10"
            if st.session_state.league == "High School (BBCOR)": drop = "-3"
            elif st.session_state.weight > 110 and st.session_state.age > 11: drop = "-8"
            
            if passed == "Yes, they struggled" and drop == "-10": drop = "-11"
            
            st.session_state.rec_name = "Marucci Cat X"
            st.session_state.rec_img = "https://m.media-amazon.com/images/I/71R2J+d-ZlL._AC_SL1500_.jpg"
            st.session_state.link = "https://www.amazon.com/s?k=marucci+cat+x+baseball+bat"
        else:
            # Softball
            if st.session_state.height > 48: length = 29
            if st.session_state.height > 52: length = 30
            if st.session_state.height > 56: length = 31
            drop = "-10"
            st.session_state.rec_name = "Easton Ghost"
            st.session_state.rec_img = "https://m.media-amazon.com/images/I/61bV2+D-ZlL._AC_SL1500_.jpg"
            st.session_state.link = "https://www.amazon.com/s?k=easton+ghost+softball+bat"

        st.session_state.bat_result = f"{length}-inch // {drop}"
        next_step()

# --- STEP 4: REPORT ---
elif st.session_state.step == 4:
    st.markdown("## 🔒 Unlock Official Specs")
    st.info("Enter parent email to view the recommendation.")
    
    email = st.text_input("Email Address")
    
    if st.button("Reveal Results", type="primary"):
        if "@" not in email:
            st.error("Please enter a valid email.")
        else:
            add_subscriber(email, st.session_state.sport, st.session_state.bat_result)
            
            # MODERN CARD RESULT
            st.markdown(f"""
            <div style="background-color:#009060; padding:20px; border-radius:15px; text-align:center; color:white; margin-bottom: 20px;">
                <h4 style="margin:0; opacity:0.8;">OFFICIAL TARGET</h4>
                <h1 style="margin:0; font-size:40px;">{st.session_state.bat_result}</h1>
            </div>
            """, unsafe_allow_html=True)
            
            col1, col2 = st.columns([1,2])
            with col1: st.image(st.session_state.rec_img)
            with col2:
                st.write(f"**Best Match:** {st.session_state.rec_name}")
                st.link_button("👉 Check Price on Amazon", st.session_state.link)
            
            st.divider()
            st.markdown("<h3 style='text-align:center'>You have the gear. Now get the card.</h3>", unsafe_allow_html=True)
            st.link_button("✨ CREATE SCOREZLE CARD", "https://scorezle.com")
            
            if st.button("Start Over"): restart()
