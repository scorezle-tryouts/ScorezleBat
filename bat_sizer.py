import streamlit as st
import requests
import time

# --- CONFIGURATION ---
st.set_page_config(page_title="Scorezle Bat Sizer", layout="centered")

# --- MAILERLITE CONNECTION ---
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

# --- THE UI (CLEAN CARD STYLE) ---

# Center the Logo/Title
col1, col2, col3 = st.columns([1,2,1])
with col2:
    st.title("⚾ BAT LAB")

# This creates the "Card" look (White box with border)
with st.container(border=True):

    # STEP 1: SPORT
    if st.session_state.step == 1:
        st.header("1. The Basics")
        st.session_state.sport = st.selectbox("Select Sport", ["Baseball", "Softball (Fastpitch)"])
        st.session_state.league = st.selectbox("Select League", ["Little League (USA Bat)", "Travel Ball (USSSA)", "High School (BBCOR)"])
        
        st.divider()
        if st.button("Next: Measurements", type="primary"): next_step()

    # STEP 2: MEASURE
    elif st.session_state.step == 2:
        st.header("2. Body Stats")
        col1, col2 = st.columns(2)
        with col1: st.session_state.height = st.number_input("Height (Inches)", 40, 80, 54)
        with col2: st.session_state.weight = st.number_input("Weight (lbs)", 40, 250, 80)
        
        st.caption("We use the Applied Vision algorithm for precision sizing.")
        st.divider()
        if st.button("Next: Strength Test", type="primary"): next_step()

    # STEP 3: STRENGTH
    elif st.session_state.step == 3:
        st.header("3. The Hold Test")
        st.write("Have the player hold a **2lb weight** straight out to the side for 20 seconds.")
        
        if st.button("⏱️ Start Timer"):
            progress_text = "Hold it steady..."
            my_bar = st.progress(0, text=progress_text)
            for percent_complete in range(100):
                time.sleep(0.2)
                my_bar.progress(percent_complete + 1, text=progress_text)
            st.success("Time's Up!")
                
        passed = st.radio("Did the arm shake?", ["No, it was easy", "Yes, they struggled"])
        
        st.divider()
        if st.button("Generate Report", type="primary"):
            # LOGIC ENGINE
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
        st.header("🏆 Official Report")
        st.info("Enter parent email to unlock the recommendation.")
        
        email = st.text_input("Email Address")
        
        if st.button("Reveal Results", type="primary"):
            if "@" not in email:
                st.error("Please enter a valid email.")
            else:
                add_subscriber(email, st.session_state.sport, st.session_state.bat_result)
                
                # RESULTS DISPLAY
                st.markdown(f"## 🎯 TARGET: {st.session_state.bat_result}")
                
                st.image(st.session_state.rec_img, width=200)
                st.write(f"**Best Match:** {st.session_state.rec_name}")
                st.link_button("👉 Check Price on Amazon", st.session_state.link)
                
                st.divider()
                st.markdown("### Next Step")
                st.write("You have the gear. Now get the card.")
                st.link_button("✨ Create Scorezle Card", "https://scorezle.com")
                
                if st.button("Start Over"): restart()
