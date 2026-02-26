import mss
import base64
import requests
import time
import json
import pyautogui
import re
import cv2 
import numpy as np 
import os
from datetime import datetime
from PIL import Image
from io import BytesIO

import tkinter as tk
import win32gui
import win32con

pyautogui.FAILSAFE = True

def setup_vision_border():
    root = tk.Tk()
    root.title("AIVisionBorder")
    root.attributes("-transparentcolor", "white")
    root.attributes("-topmost", True)
    root.overrideredirect(True) 
    screen_width, screen_height = pyautogui.size()
    root.geometry(f"{screen_width}x{screen_height}+0+0")
    
    canvas = tk.Canvas(root, width=screen_width, height=screen_height, bg="white", highlightthickness=0)
    canvas.pack()
    border_thickness = 8
    canvas.create_rectangle(
        border_thickness/2, border_thickness/2, 
        screen_width - border_thickness/2, screen_height - border_thickness/2, 
        outline="#39FF14", width=border_thickness 
    )
    root.update() 
    
    hwnd = win32gui.FindWindow(None, "AIVisionBorder")
    if hwnd:
        styles = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
        win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, styles | win32con.WS_EX_LAYERED | win32con.WS_EX_TRANSPARENT)
    return root

def capture_screen():
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        sct_img = sct.grab(monitor)
        img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
        cv_log_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        img.thumbnail((1024, 1024)) 
        buffered = BytesIO()
        img.save(buffered, format="JPEG")
        base64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return base64_str, cv_log_img

def get_next_action(base64_image, task_description, history):
    url = "http://localhost:1234/v1/chat/completions"
    
    system_prompt = (
        "You are an autonomous GUI agent. Look at the screen and determine the single next action. "
        "You have six action types: 'click', 'press_key', 'type_text', 'wait', 'mash_keys', or 'done'. "
        "STRATEGY RULES: "
        "1. VISUAL FIRST: Scan the screen for the target application. If you see it, 'click' it. "
        "2. SEARCH SECOND: If the app is NOT visible, use {\"action\": \"press_key\", \"key\": \"win\"} to open the search menu. "
        "3. AVOID REPETITION: Read the 'Previous Actions' list. If you just pressed 'win', do NOT press it again. Move on to typing. "
        "4. TEXT ENTRY LIFECYCLE: If your previous action was clicking a search bar or message input box, your VERY NEXT action MUST be 'type_text'. Do NOT click it again. "
        "5. SENDING MESSAGES: After using 'type_text' to write a message, your VERY NEXT action MUST be 'press_key' with the 'enter' key to send it. "
        "6. ON-SCREEN INSTRUCTIONS: If the website explicitly says 'Press any key' or 'Type to start', you MUST output a 'press_key', 'type_text', or 'mash_keys' action. Do NOT 'click' the instruction text. "
        "7. KEYBOARD TESTING: If the user asks you to test the keyboard or press multiple specific keys sequentially on a testing site, use the 'mash_keys' action to run a bulk testing macro. "
        "For clicks, output coordinates as a float percentage (0.00 to 1.00). "
        "Respond ONLY with a valid JSON object. "
        "Format for clicking: {\"action\": \"click\", \"x_pct\": float, \"y_pct\": float, \"reason\": \"string\"} "
        "Format for single keys: {\"action\": \"press_key\", \"key\": \"string\", \"reason\": \"string\"} "
        "Format for typing text: {\"action\": \"type_text\", \"text\": \"string\", \"reason\": \"string\"} "
        "Format for waiting: {\"action\": \"wait\", \"seconds\": integer, \"reason\": \"string\"} "
        "Format for bulk key testing: {\"action\": \"mash_keys\", \"reason\": \"string\"} "
        "Format for completion: {\"action\": \"done\", \"reason\": \"string\"}"
    )
    
    user_text = f"Task: {task_description}.\nPrevious Actions: {history}\nBased on the current screen, what is the SINGLE next step?"
    
    payload = {
        "model": "qwen3-vl-4b",
        "messages": [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                ]
            }
        ],
        "temperature": 0.1, 
        "max_tokens": 150
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            clean_content = json_match.group(0)
            clean_content = re.sub(r'"x_pct":\s*([0-9.]+),\s*([0-9.]+)', r'"x_pct": \1, "y_pct": \2', clean_content)
        else:
            clean_content = content
            
        return json.loads(clean_content)
    except Exception as e:
        print(f"\n[!] Parsing/API Error: {e}")
        return None

# --- NEW: Wrapped the main loop into a callable function ---
def run_vision_agent(task):
    """Executes the autonomous GUI agent for a specific task."""
    print(f"\n[Worker] Starting Vision Task: {task}")
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_dir = f"agent_logs/run_{timestamp}"
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "agent_log.txt")
    
    with open(log_file, "w") as f:
        f.write(f"Task: {task}\nStarted at: {timestamp}\n" + "="*50 + "\n")
        
    vision_ui = setup_vision_border()
    screen_width, screen_height = pyautogui.size()
        
    mechanical_history = []
    cognitive_history = [] 
    step = 1
    task_success = False
    
    try:
        while True: 
            vision_ui.update()
            img_base64, cv_log_img = capture_screen()
            
            recent_history = cognitive_history[-3:] if len(cognitive_history) > 0 else "None"
            action_data = get_next_action(img_base64, task, recent_history)
            
            if not action_data:
                time.sleep(2)
                step += 1
                continue 
                
            reason = action_data.get('reason', 'No reason provided')
            action_type = action_data.get("action")
            
            cognitive_history.append(str(action_data))
            action_core = {k: v for k, v in action_data.items() if k != 'reason'}
            mechanical_history.append(str(action_core))
            
            # Loop Detection
            if len(mechanical_history) >= 3 and mechanical_history[-1] == mechanical_history[-2] == mechanical_history[-3]:
                print("\n[!] CRITICAL: Infinite Loop Detected! Halting Vision Worker.")
                with open(log_file, "a") as f:
                    f.write(f"Step {step} | FAILED: Infinite Loop Detected. Halted.\n" + "="*50 + "\n")
                break # Exits the loop with task_success still False
            
            log_entry = f"Step {step} | Action: {action_type} | Reason: {reason}\n"
            
            # Execution Blocks
            if action_type == "click":
                x_pct = max(0.0, min(1.0, float(action_data.get("x_pct", 0.0))))
                y_pct = max(0.0, min(1.0, float(action_data.get("y_pct", 0.0))))
                real_x = int(screen_width * x_pct)
                real_y = int(screen_height * y_pct)
                pyautogui.moveTo(real_x, real_y, duration=0.5)
                pyautogui.click()
                cv2.circle(cv_log_img, (real_x, real_y), 12, (0, 255, 255), 4) 
                cv2.circle(cv_log_img, (real_x, real_y), 8, (0, 0, 255), -1)   
                log_entry += f"Coordinates: ({real_x}, {real_y}) based on [{x_pct:.2f}, {y_pct:.2f}]\n"
                
            elif action_type == "press_key":
                key_to_press = action_data.get("key", "")
                pyautogui.press(key_to_press)
                log_entry += f"Key: {key_to_press}\n"

            elif action_type == "type_text":
                text_to_type = action_data.get("text", "")
                pyautogui.write(text_to_type, interval=0.05)
                log_entry += f"Text Typed: {text_to_type}\n"
                
            elif action_type == "wait":
                wait_time = action_data.get("seconds", 3) 
                time.sleep(wait_time)
                log_entry += f"Action: Waited {wait_time} seconds.\n"

            elif action_type == "mash_keys":
                test_keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
                             'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
                             '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'space']
                for key in test_keys:
                    pyautogui.press(key)
                    time.sleep(0.02)
                log_entry += "Action: Executed bulk keyboard mash sequence.\n"
                
            elif action_type == "done":
                print("\n[Worker] ✅ Task complete.")
                log_entry += "Status: Task Complete.\n"
                task_success = True
                with open(log_file, "a") as f:
                    f.write(log_entry + "-"*50 + "\n")
                break
                
            # Logging
            with open(log_file, "a") as f:
                f.write(log_entry + "-"*50 + "\n")
            img_filename = os.path.join(log_dir, f"step_{step}_{action_type}.jpg")
            cv2.imwrite(img_filename, cv_log_img)
            
            time.sleep(2) 
            step += 1
            
    finally:
        vision_ui.destroy()
        
    # Return the final status to the Manager
    return task_success

# If you run Agent.py directly, it will still work as a standalone script!
if __name__ == "__main__":
    print("\n" + "="*50)
    print("🤖 LOCAL VISION AGENT INITIALIZATION")
    print("="*50)
    user_task = input("\n[?] What would you like the AI to do?\n> ")
    if user_task.strip():
        run_vision_agent(user_task)