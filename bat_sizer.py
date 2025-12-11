import streamlit as st
import requests

# CONFIGURATION
st.set_page_config(page_title="The Scorezle Bat Lab", layout="centered")

# --- MAILERLITE FUNCTION ---
def add_subscriber(email, sport, bat_result):
    url = "https://connect.mailerlite.com/api/subscribers"
    # This grabs the key from Streamlit Secrets
    token = st.secrets["MAILERLITE_KEY"]
    
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
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code in [200, 201]:
            print("Success: Email sent to MailerLite")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Connection Error: {e}")

# --- THE APP UI ---

st.title("⚾ The Scorezle Bat Lab")
st.markdown("### The Official Pro Sizing Instrument")

# TABS
tab1, tab2, tab3 = st.tabs(["📏 The Pro Sizer", "👀 Bat Anatomy", "⚖️ League Rules"])

with tab1:
    st.write("Most parents buy the wrong size. Let's fix that in 20 seconds.")
    
    # INPUTS
    col1, col2 = st.columns(2)
    with col1:
        sport = st.selectbox("Sport", ["Baseball", "Softball (Fastpitch)"])
        league = st.selectbox("League", ["Little League (USA)", "Travel Ball (USSSA)", "High School (BBCOR)"])
    with col2:
        height_in = st.number_input("Height (Inches)", 40, 80, 54)
        weight_lbs = st.number_input("Weight (lbs)", 40, 250, 80)

    # LOGIC ENGINE
    length = 26
    if sport == "Baseball":
        if height_in > 40: length = 27
        if height_in > 44: length = 28
        if height_in > 48: length = 29
        if height_in > 52: length = 30
        if height_in > 56: length = 31
        if height_in > 60: length = 32
        
        drop = "-10"
        if league == "High School (BBCOR)": drop = "-3 (Mandatory)"
        elif weight_lbs > 110: drop = "-8"
        
        rec_name = "Marucci Cat X"
        link = "https://www.amazon.com/s?k=marucci+cat+x+baseball+bat"
    else:
        # Softball Logic
        if height_in > 48: length = 29
        if height_in > 52: length = 30
        if height_in > 56: length = 31
        if height_in > 60: length = 32
        drop = "-10"
        rec_name = "Easton Ghost"
        link = "https://www.amazon.com/s?k=easton+ghost+softball+bat"

    result_text = f"{length}-inch // {drop} Drop"

    # THE HOLD TEST
    st.info("💪 **The Hold Test:** Can the player hold a 2lb weight straight out for 20 seconds?")
    if st.button("⏱️ Start 20-Second Timer"):
        with st.empty():
            import time
            for seconds in range(20, 0, -1):
                st.write(f"⏳ Hold it... {seconds}")
                time.sleep(1)
            st.success("Time's Up! If arm shook, buy a lighter bat.")
            st.balloons()

    st.divider()

    # THE EMAIL GATE
    email = st.text_input("📧 Where should we send your Official Scouting Report?")
    st.caption("🔒 We respect your privacy. Unlock your results & join the Scorezle Pro tips list.")

    if st.button("🚀 Get Official Report"):
        if "@" not in email:
            st.error("Please enter a valid email address.")
        else:
            # Send to MailerLite
            add_subscriber(email, sport, result_text)
            
            st.success(f"Report Sent to {email}!")
            
            # SHOW RESULTS
            st.markdown(f"## 🎯 YOUR TARGET: {result_text}")
            
            c1, c2 = st.columns([1,2])
            with c2:
                st.subheader(f"Recommended: {rec_name}")
                st.link_button("Check Price on Amazon", link)
            
            st.success("Now make them look like a Pro. Create your Scorezle Card below.")

with tab2:
    st.header("Bat Anatomy 101")
    st.write("**Barrel:** The thick part where you hit the ball.")
    st.write("**Drop Weight:** The difference between Length and Weight. (Length - Weight = Drop).")
    st.info("Pro Tip: A lighter bat (-12) is faster, but a heavier bat (-8) has more power.")

with tab3:
    st.header("Legal Rules")
    st.warning("High Schoolers MUST swing BBCOR (-3).")
    st.write("**USSSA:** For Travel Ball. Big pop.")
    st.write("**USA Bat:** For Little League. Wood-like performance.")

# FOOTER
st.divider()
st.markdown("### 🏆 Made by Scorezle")
st.link_button("✨ Create Your Custom Trading Card", "https://scorezle.com")
