import mss
import base64
import requests
import time
import comtypes.client
import json
import pyautogui
import re
import cv2 
import numpy as np 
import os
import ctypes
import threading
from datetime import datetime
from PIL import Image
from io import BytesIO

import tkinter as tk
from tkinter import scrolledtext
import win32gui
import win32con
import speech_recognition as sr
import pyttsx3 

# Force physical pixel mapping
try:
    ctypes.windll.shcore.SetProcessDpiAwareness(2) 
except Exception:
    try:
        ctypes.windll.user32.SetProcessDPIAware()
    except Exception:
        pass

pyautogui.FAILSAFE = True

class AgentGUI:
    def __init__(self, root):
        self.win = root
        self.win.overrideredirect(True)
        self.win.attributes("-topmost", True)
        
        self.w, self.h = 550, 680
        sw = self.win.winfo_screenwidth()
        sh = self.win.winfo_screenheight()
        x = sw - self.w - 30
        y = sh - self.h - 60 
        self.win.geometry(f"{self.w}x{self.h}+{x}+{y}")
        
        self.border_color = "#39FF14" 
        self.bg_color = "#181818"     
        self.win.config(bg=self.border_color)
        
        self.canvas = tk.Frame(self.win, bg=self.bg_color, bd=0)
        self.canvas.place(x=1, y=1, width=self.w-2, height=self.h-2)
        
        self.is_running = False
        self.mic_state = "WAKE_WORD" 
        
        self.engine = pyttsx3.init()
        self.engine.setProperty('rate', 170) 
        
        with mss.mss() as sct:
            monitor = sct.monitors[1]
            self.screen_width = monitor["width"]
            self.screen_height = monitor["height"]
            self.monitor_left = monitor["left"]
            self.monitor_top = monitor["top"]
            
        self.setup_vision_border()
        self.setup_ui()
        
        # UPGRADE: Bind the "Wake Up" event to restore borderless mode
        self.win.bind("<Map>", self.on_window_map)
        
        # Force Windows to keep the borderless app in the Taskbar!
        self.win.after(10, self.set_appwindow)
        
        threading.Thread(target=self.wake_word_loop, daemon=True).start()

    def set_appwindow(self):
        """Uses Windows C-API to force the borderless window into the Taskbar natively."""
        hwnd = ctypes.windll.user32.GetParent(self.win.winfo_id())
        GWL_EXSTYLE = -20
        WS_EX_APPWINDOW = 0x00040000
        WS_EX_TOOLWINDOW = 0x00000080
        
        style = ctypes.windll.user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
        style = style & ~WS_EX_TOOLWINDOW
        style = style | WS_EX_APPWINDOW
        ctypes.windll.user32.SetWindowLongW(hwnd, GWL_EXSTYLE, style)

    def setup_vision_border(self):
        self.border_win = tk.Toplevel(self.win)
        self.border_win.title("AIVisionBorder")
        self.border_win.attributes("-transparentcolor", "white")
        self.border_win.attributes("-topmost", True)
        self.border_win.overrideredirect(True) 
        self.border_win.geometry(f"{self.screen_width}x{self.screen_height}+{self.monitor_left}+{self.monitor_top}")
        
        canvas = tk.Canvas(self.border_win, width=self.screen_width, height=self.screen_height, bg="white", highlightthickness=0)
        canvas.pack()
        border_thickness = 5
        canvas.create_rectangle(
            border_thickness/2, border_thickness/2, 
            self.screen_width - border_thickness/2, self.screen_height - border_thickness/2, 
            outline="#39FF14", width=border_thickness 
        )
        
        hwnd = win32gui.FindWindow(None, "AIVisionBorder")
        if hwnd:
            styles = win32gui.GetWindowLong(hwnd, win32con.GWL_EXSTYLE)
            win32gui.SetWindowLong(hwnd, win32con.GWL_EXSTYLE, styles | win32con.WS_EX_LAYERED | win32con.WS_EX_TRANSPARENT)

    def setup_ui(self):
        fonts = {"title": ("Segoe UI", 11, "bold"), "body": ("Segoe UI", 10), "log": ("Consolas", 9)}
        self.colors = {"bg": self.bg_color, "surface": "#252525", "primary": "#BB86FC", "accent": "#03DAC6", "text": "#E0E0E0", "error": "#CF6679"}

        self.title_frame = tk.Frame(self.canvas, bg=self.colors["surface"])
        self.title_frame.place(x=0, y=0, width=self.w-2, height=35)
        
        tk.Label(self.title_frame, text="✨ Vaani AI Command Center", fg=self.colors["text"], bg=self.colors["surface"], font=fonts["title"]).pack(side=tk.LEFT, padx=15)
        
        ctrl_frame = tk.Frame(self.title_frame, bg=self.colors["surface"])
        ctrl_frame.pack(side=tk.RIGHT, padx=5)
        
        self.min_btn = tk.Button(ctrl_frame, text="—", bg=self.colors["surface"], fg=self.colors["text"], bd=0, font=("Segoe UI", 10, "bold"), cursor="hand2", command=self.minimize_app)
        self.min_btn.pack(side=tk.LEFT, padx=5)
        
        self.close_btn = tk.Button(ctrl_frame, text="X", bg=self.colors["surface"], fg=self.colors["error"], bd=0, font=("Segoe UI", 10, "bold"), cursor="hand2", command=self.close_app)
        self.close_btn.pack(side=tk.LEFT, padx=5)
        
        self.close_btn.bind("<Enter>", lambda e: self.close_btn.config(bg="#FF4C4C", fg="white"))
        self.close_btn.bind("<Leave>", lambda e: self.close_btn.config(bg=self.colors["surface"], fg=self.colors["error"]))
        self.min_btn.bind("<Enter>", lambda e: self.min_btn.config(bg="#444444"))
        self.min_btn.bind("<Leave>", lambda e: self.min_btn.config(bg=self.colors["surface"]))
        
        self.title_frame.bind("<ButtonPress-1>", self.start_move)
        self.title_frame.bind("<ButtonRelease-1>", self.stop_move)
        self.title_frame.bind("<B1-Motion>", self.do_move)

        self.content = tk.Frame(self.canvas, bg=self.colors["bg"])
        self.content.place(x=15, y=45, width=self.w-32, height=self.h-60)

        tk.Label(self.content, text="Task Description:", fg=self.colors["primary"], bg=self.colors["bg"], font=fonts["title"]).pack(anchor="w", pady=(5,2))
        self.task_entry = tk.Entry(self.content, bg=self.colors["surface"], fg=self.colors["text"], font=fonts["body"], insertbackground=self.colors["text"], relief=tk.FLAT)
        self.task_entry.pack(fill=tk.X, pady=(0, 15), ipady=6)
        
        self.btn_frame = tk.Frame(self.content, bg=self.colors["bg"])
        self.btn_frame.pack(fill=tk.X, pady=(0, 15))
        
        self.voice_btn = tk.Button(self.btn_frame, text="🎤 VOICE START", bg=self.colors["primary"], fg="#FFFFFF", font=fonts["title"], relief=tk.FLAT, cursor="hand2", command=self.start_voice_agent)
        self.voice_btn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5), ipady=4)

        self.start_btn = tk.Button(self.btn_frame, text="▶ TEXT START", bg=self.colors["accent"], fg="#000000", font=fonts["title"], relief=tk.FLAT, cursor="hand2", command=self.start_agent)
        self.start_btn.pack(side=tk.LEFT, expand=True, fill=tk.X, padx=(0, 5), ipady=4)
        
        self.stop_btn = tk.Button(self.btn_frame, text="⏹ STOP", bg=self.colors["error"], fg="#FFFFFF", font=fonts["title"], relief=tk.FLAT, cursor="hand2", state=tk.DISABLED, command=self.stop_agent)
        self.stop_btn.pack(side=tk.RIGHT, expand=True, fill=tk.X, padx=(5, 0), ipady=4)

        self.status_frame = tk.Frame(self.content, bg=self.colors["bg"])
        self.status_frame.pack(fill=tk.X, pady=(0, 5))
        
        self.step_lbl = tk.Label(self.status_frame, text="Step: 0", fg=self.colors["accent"], bg=self.colors["bg"], font=fonts["title"])
        self.step_lbl.pack(side=tk.LEFT)
        
        self.action_lbl = tk.Label(self.status_frame, text="Say 'Start Voice'", fg="#FFB74D", bg=self.colors["bg"], font=fonts["body"])
        self.action_lbl.pack(side=tk.RIGHT)

        tk.Label(self.content, text="Execution Logs:", fg=self.colors["primary"], bg=self.colors["bg"], font=fonts["title"]).pack(anchor="w")
        
        self.log_area = scrolledtext.ScrolledText(self.content, bg="#121212", fg="#A9B7C6", font=fonts["log"], relief=tk.FLAT, wrap=tk.WORD, state=tk.DISABLED, bd=0)
        self.log_area.pack(fill=tk.BOTH, expand=True, pady=(5, 5))
        
        self.resize_grip = tk.Label(self.canvas, text="◢", bg=self.colors["bg"], fg="#555555", font=("Segoe UI", 12), cursor="size_nw_se")
        self.resize_grip.place(x=self.w-22, y=self.h-26)
        
        self.resize_grip.bind("<ButtonPress-1>", self.start_resize)
        self.resize_grip.bind("<B1-Motion>", self.do_resize)

    # --- THE MINIMIZE FIX ---
    def minimize_app(self):
        # 1. Temporarily give the window back to Windows OS
        self.win.overrideredirect(False) 
        # 2. Now we can legally minimize it to the taskbar
        self.win.iconify()

    def on_window_map(self, event):
        # 3. When the user clicks the taskbar icon to wake it up,
        # we instantly rip the Windows border back off!
        if event.widget == self.win:
            self.win.overrideredirect(True)
            self.set_appwindow()

    def close_app(self):
        self.is_running = False
        self.mic_state = "STOPPED"
        try:
            self.engine.stop()
        except:
            pass
        self.win.destroy()
        os._exit(0) 

    def start_resize(self, event):
        self.start_x = event.x_root
        self.start_y = event.y_root
        self.start_w = self.w
        self.start_h = self.h

    def do_resize(self, event):
        dx = event.x_root - self.start_x
        dy = event.y_root - self.start_y
        self.w = max(450, self.start_w + dx)
        self.h = max(350, self.start_h + dy)
        self.win.geometry(f"{self.w}x{self.h}")
        self.canvas.place(x=1, y=1, width=self.w-2, height=self.h-2)
        self.title_frame.place(x=0, y=0, width=self.w-2, height=35)
        self.content.place(x=15, y=45, width=self.w-32, height=self.h-60)
        self.resize_grip.place(x=self.w-22, y=self.h-26)

    def start_move(self, event):
        self.x = event.x
        self.y = event.y

    def stop_move(self, event):
        self.x = None
        self.y = None

    def do_move(self, event):
        deltax = event.x - self.x
        deltay = event.y - self.y
        x = self.win.winfo_x() + deltax
        y = self.win.winfo_y() + deltay
        self.win.geometry(f"+{x}+{y}")

    def log(self, message):
        self.win.after(0, self._log_safe, message)
        
    def _log_safe(self, message):
        self.log_area.config(state=tk.NORMAL)
        self.log_area.insert(tk.END, message + "\n")
        self.log_area.see(tk.END)
        self.log_area.config(state=tk.DISABLED)

    def update_status(self, step, text):
        self.win.after(0, self._status_safe, step, text)
        
    def _status_safe(self, step, text):
        self.step_lbl.config(text=f"Step: {step}")
        self.action_lbl.config(text=text)

    # UPGRADE: Bypassing pyttsx3 entirely to use native Windows SAPI5
    # This guarantees the agent speaks EVERY time, without freezing.
    def speak(self, text):
        def _speak_thread():
            try:
                comtypes.CoInitialize() 
                # Create a direct link to the Windows Voice Engine
                speaker = comtypes.client.CreateObject("SAPI.SpVoice")
                
                # SAPI rate goes from -10 to 10 (0 is normal speed)
                speaker.Rate = 2 
                
                speaker.Speak(text)
            except Exception as e:
                pass
            finally:
                comtypes.CoUninitialize()
        
        threading.Thread(target=_speak_thread, daemon=True).start()

    def wake_word_loop(self):
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=0.5)
            self.log("🎧 Wake Word Monitor Active. Say 'Start Voice'.")
            
            while True:
                if self.mic_state != "WAKE_WORD":
                    time.sleep(0.5)
                    continue
                    
                try:
                    audio = r.listen(source, timeout=4, phrase_time_limit=180)
                    text = r.recognize_google(audio).lower()
                    
                    if "start voice" in text or "start voice" in text:
                        self.log("\n🎙️ Wake word detected!")
                        self.mic_state = "TASK" 
                        self.speak("I am listening.")
                        self.win.after(0, self.start_voice_agent)
                except:
                    continue

    def start_voice_agent(self):
        if self.is_running: return
        self.mic_state = "TASK" 
        
        self.log("🎙️ Recording your task prompt... (Speak for up to 60 seconds)")
        self.update_status(0, "Listening for task...")
        self.start_btn.config(state=tk.DISABLED)
        self.voice_btn.config(state=tk.DISABLED)
        self.task_entry.config(state=tk.DISABLED)
        
        def listen_thread():
            r = sr.Recognizer()
            try:
                with sr.Microphone() as source:
                    r.adjust_for_ambient_noise(source, duration=0.2)
                    audio = r.listen(source, timeout=15, phrase_time_limit=60)
                text = r.recognize_google(audio)
                self.win.after(0, self._set_task_and_start, text)
            except Exception as e:
                self.log("[!] Could not hear a prompt. Going back to sleep.")
                self.win.after(0, self._reset_buttons)
                
        threading.Thread(target=listen_thread, daemon=True).start()

    def _set_task_and_start(self, text):
        self.task_entry.config(state=tk.NORMAL)
        self.task_entry.delete(0, tk.END)
        self.task_entry.insert(0, text)
        self.log(f"🗣️ Heard Task: '{text}'")
        self.start_agent()

    def listen_for_stop_command(self):
        r = sr.Recognizer()
        with sr.Microphone() as source:
            r.adjust_for_ambient_noise(source, duration=0.2)
            self.log("🎧 Voice-Stop monitor active. Say 'STOP' to halt AI.")
            
            while self.mic_state == "RUNNING":
                try:
                    audio = r.listen(source, timeout=4, phrase_time_limit=160)
                    text = r.recognize_google(audio).lower()
                    if "stop" in text or "cancel" in text or "halt" in text:
                        self.log(f"\n🛑 Voice Command '{text.upper()}' recognized!")
                        self.win.after(0, self.stop_agent)
                        break
                except:
                    continue

    def start_agent(self):
        task = self.task_entry.get()
        if not task.strip():
            self.log("[!] Please enter a task description first.")
            self._reset_buttons()
            return
            
        self.is_running = True
        self.mic_state = "RUNNING" 
        
        self.start_btn.config(state=tk.DISABLED, bg="#555555")
        self.voice_btn.config(state=tk.DISABLED, bg="#555555")
        self.stop_btn.config(state=tk.NORMAL)
        self.task_entry.config(state=tk.DISABLED)
        
        self.log_area.config(state=tk.NORMAL)
        self.log_area.delete(1.0, tk.END)
        self.log_area.config(state=tk.DISABLED)
        
        self.log("🚀 Initializing Autonomous Vision Agent...")
        self.log(f"📋 Task: {task}\n" + "="*40)
        
        threading.Thread(target=self.run_agent_loop, args=(task,), daemon=True).start()
        threading.Thread(target=self.listen_for_stop_command, daemon=True).start()

    def stop_agent(self):
        self.is_running = False
        self.log("\n[!] User requested STOP. Halting after current operation...")
        self._reset_buttons()
        
    def _reset_buttons(self):
        self.start_btn.config(state=tk.NORMAL, bg=self.colors["accent"])
        self.voice_btn.config(state=tk.NORMAL, bg=self.colors["primary"])
        self.stop_btn.config(state=tk.DISABLED)
        self.task_entry.config(state=tk.NORMAL)
        self.update_status(0, "Say 'Start Voice'")
        self.mic_state = "WAKE_WORD" 

    def hide_window(self):
        self.win.after(0, self.win.withdraw)
        self.win.after(0, self.border_win.withdraw)
        
    def show_window(self):
        self.win.after(0, self.win.deiconify)
        self.win.after(0, self.border_win.deiconify)

    def run_agent_loop(self, task):
        global capture_screen, get_next_action
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        log_dir = f"agent_logs/run_{timestamp}"
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "agent_log.txt")
            
        mechanical_history = [] 
        cognitive_history = []  
        previous_image_base64 = None  
        
        step = 1
        time.sleep(1) 
        
        try:
            while self.is_running: 
                self.update_status(step, "Capturing screen...")
                
                self.hide_window()
                time.sleep(0.15) 
                img_base64, cv_log_img = capture_screen()
                self.show_window()
                
                if not self.is_running: break
                
                self.update_status(step, "Analyzing UI (Thinking)...")
                self.log(f"\n--- Step {step} ---")
                
                recent_history = cognitive_history[-3:] if len(cognitive_history) > 0 else "None"
                action_data = get_next_action(img_base64, previous_image_base64, task, recent_history)
                next_previous_image_base64 = img_base64 
                
                if not self.is_running: break
                
                if not action_data:
                    self.log("[!] Bad API Response. Retrying...")
                    time.sleep(2)
                    step += 1
                    continue 
                    
                reason = action_data.get('reason', 'No reason provided')
                action_type = action_data.get("action")
                
                self.log(f"🧠 Reason: {reason}")
                
                cognitive_history.append(str(action_data))
                action_core = {k: v for k, v in action_data.items() if k != 'reason'}
                mechanical_history.append(str(action_core))
                
                if len(mechanical_history) >= 3:
                    if mechanical_history[-1] == mechanical_history[-2] == mechanical_history[-3]:
                        self.log("[!] CRITICAL: Infinite Loop Detected! Halting.")
                        break
                
                log_entry = f"Step {step} | Action: {action_type} | Reason: {reason}\n"
                
                if action_type == "click":
                    x_pct = max(0.0, min(1.0, float(action_data.get("x_pct", 0.0))))
                    y_pct = max(0.0, min(1.0, float(action_data.get("y_pct", 0.0))))
                    
                    x_px = int(self.screen_width * x_pct)
                    y_px = int(self.screen_height * y_pct)
                    real_x = self.monitor_left + x_px
                    real_y = self.monitor_top + y_px
                    
                    self.update_status(step, f"Clicking ({real_x}, {real_y})")
                    self.log(f"🎯 Action: Clicking at ({real_x}, {real_y})")
                    
                    pyautogui.moveTo(real_x, real_y, duration=0.3)
                    pyautogui.click()
                    
                    cv2.circle(cv_log_img, (x_px, y_px), 24, (0, 0, 0), 4)      
                    cv2.circle(cv_log_img, (x_px, y_px), 20, (0, 255, 0), -1)   
                    
                    rgb_img = cv2.cvtColor(cv_log_img, cv2.COLOR_BGR2RGB)
                    mem_img = Image.fromarray(rgb_img)
                    mem_img.thumbnail((1024, 1024))
                    buf = BytesIO()
                    mem_img.save(buf, format="JPEG", quality=85)
                    next_previous_image_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
                    time.sleep(0.5) 
                    
                elif action_type == "press_key":
                    key_to_press = action_data.get("key", "").lower()
                    self.update_status(step, f"Pressing '{key_to_press}'")
                    self.log(f"⌨️ Action: Pressing '{key_to_press}'")
                    
                    if '+' in key_to_press:
                        keys = key_to_press.split('+')
                        pyautogui.hotkey(*keys)
                    else:
                        pyautogui.press(key_to_press)
                    time.sleep(0.5) 
                    
                elif action_type == "type_text":
                    text_to_type = action_data.get("text", "")
                    self.update_status(step, "Typing text...")
                    self.log(f"📝 Action: Typing '{text_to_type}'")
                    
                    pyautogui.write(text_to_type, interval=0.05)
                    time.sleep(0.5) 
                    
                elif action_type == "wait":
                    wait_time = action_data.get("seconds", 3) 
                    self.update_status(step, f"Waiting {wait_time}s...")
                    self.log(f"⏳ Action: Waiting {wait_time} seconds")
                    time.sleep(wait_time)

                elif action_type == "done":
                    self.update_status(step, "Task Complete!")
                    self.log("\n✅ AI indicates the task is complete.")
                    self.speak("Task complete.")
                    break
                    
                with open(log_file, "a") as f:
                    f.write(log_entry + "-"*50 + "\n")
                img_filename = os.path.join(log_dir, f"step_{step}_{action_type}.jpg")
                cv2.imwrite(img_filename, cv_log_img)
                
                previous_image_base64 = next_previous_image_base64
                time.sleep(0.5) 
                step += 1
                
        except Exception as e:
            self.log(f"\n[!] Error during execution: {str(e)}")
            
        finally:
            self.is_running = False
            self.win.after(0, self._reset_buttons)

def capture_screen():
    with mss.mss() as sct:
        monitor = sct.monitors[1]
        sct_img = sct.grab(monitor)
        img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")
        cv_log_img = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        
        img.thumbnail((1024, 1024)) 
        buffered = BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        base64_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        return base64_str, cv_log_img

def get_next_action(base64_image, previous_image, task_description, history):
    url = "http://localhost:1234/v1/chat/completions"
    
    system_prompt = (
        "You are an autonomous GUI agent. Look at the screen and determine the single next action. "
        "You have six action types: 'click', 'press_key', 'type_text', 'wait', 'mash_keys', or 'done'. "
        "STRATEGY RULES: "
        "1. VISUAL FIRST: Scan the screen for the target application. If you see it, 'click' it. "
        "2. SEARCH SECOND: If the app is NOT visible, use {\"action\": \"press_key\", \"key\": \"win\"} to open the search menu. "
        "3. AVOID REPETITION: Read the 'Previous Actions' list. If you just pressed 'win', do NOT press it again. Move on to typing. "
        "4. ON-SCREEN INSTRUCTIONS: If the website explicitly says 'Press any key', output a 'press_key' action. "
        "5. POPUPS & UI LATENCY: If you just clicked 'Submit' or 'OK', your VERY NEXT action MUST be a 'wait' action for at least 3 seconds. "
        "6. VISUAL ERROR CORRECTION: Compare PREVIOUS and CURRENT screens. If your last action was a click, the PREVIOUS screen will show a bright GREEN DOT exactly where you clicked. If you missed your target, adjust your percentage coordinates slightly and try again. Do NOT output the same coordinates. "
        "7. BROWSER NAVIGATION: To go to a new website, NEVER use the search menu. ALWAYS use 'ctrl+l' to focus the URL bar, then 'type_text' the exact address, then press 'enter'. "
        "8. LOGIN AVOIDANCE: You are already authenticated. NEVER attempt to log in. NEVER type fake passwords. "
        "9. DIRECT COMPOSE: If Chrome is open, skip searching. Just use 'ctrl+l' and type 'mail.google.com/mail/?view=cm&fs=1' and press 'enter' to instantly open a new email window. "
        "10. GMAIL COMPOSE SEQUENCE (CRITICAL): When filling out an email, you MUST use this exact sequence of actions, one per step: A) 'type_text' the email address. B) 'press_key' for 'enter' (creates the recipient chip). C) 'press_key' for 'tab' (moves cursor to Subject). D) 'type_text' the subject. E) 'press_key' for 'tab' (moves cursor to Body). F) 'type_text' the message. G) 'press_key' for 'ctrl+enter' (sends the email). NEVER type the subject or body into the 'To' field. "
        "CRITICAL COORDINATE RULE: For clicks, output coordinates as a float percentage with EXACTLY 3 DECIMAL PLACES (0.000 to 1.000). "
        "Respond ONLY with a valid JSON object. "
        "Format for clicking: {\"action\": \"click\", \"x_pct\": float, \"y_pct\": float, \"reason\": \"string\"} "
        "Format for keys: {\"action\": \"press_key\", \"key\": \"string\", \"reason\": \"string\"} "
        "Format for typing text: {\"action\": \"type_text\", \"text\": \"string\", \"reason\": \"string\"} "
        "Format for waiting: {\"action\": \"wait\", \"seconds\": integer, \"reason\": \"string\"} "
        "Format for completion: {\"action\": \"done\", \"reason\": \"string\"}"
    )
    
    user_text = f"Task: {task_description}.\nPrevious Actions: {history}\nCompare the previous and current screens. What is the SINGLE next step?"
    content_payload = [{"type": "text", "text": user_text}]
    
    if previous_image:
        content_payload.append({"type": "text", "text": "[IMAGE 1: PREVIOUS SCREEN STATE WITH GREEN ACTION DOT]"})
        content_payload.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{previous_image}"}})
        
    content_payload.append({"type": "text", "text": "[IMAGE 2: CURRENT SCREEN STATE]"})
    content_payload.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}})
    
    payload = {
        "model": "qwen3-vl-4b",
        "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": content_payload}],
        "temperature": 0.2, 
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
        return None

if __name__ == "__main__":
    root = tk.Tk()
    app = AgentGUI(root)
    root.mainloop()