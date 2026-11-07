import { Component, ViewChild, ElementRef, AfterViewChecked, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { catchError, of } from 'rxjs';
import { RagApiService } from '../../core/services/rag-api.service';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})
export class ChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollEl') scrollEl!: ElementRef;

  messages: Array<{from:string, text:string, time:string}> = [
    { from: 'bot', text: 'Hello! I\'m EduBoost, your AI learning assistant. How can I help you today? 🎓', time: this.now() }
  ];
  input = '';
  isTyping = false;

  suggestions = [
    'What courses are available?',
    'How do I track my progress?',
    'Give me study tips',
    'How do I reset my password?'
  ];

  constructor(
    private location: Location,
    private ragApi: RagApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.ragApi.getHistory().pipe(catchError(() => of([]))).subscribe(history => {
      if (history?.length) {
        this.messages = history.map((m: any) => ({
          from: m.from || m.sender || 'bot',
          text: m.text || m.message || '',
          time: this.formatTime(m.time || m.timestamp)
        }));
      }
    });
  }

  now() {
    const d = new Date();
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom() {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (this.scrollEl) {
        this.scrollEl.nativeElement.scrollTop = this.scrollEl.nativeElement.scrollHeight;
      }
    } catch(e) {}
  }

  send() {
    const text = this.input.trim();
    if (!text) return;
    this.messages.push({ from: 'user', text, time: this.now() });
    this.input = '';
    this.isTyping = true;

    this.ragApi.sendMessage(text).pipe(catchError(() => of(null))).subscribe(res => {
      this.isTyping = false;
      const reply = res?.answer || res?.assistantMessage?.text || 'I could not reach the database assistant right now. Please try again.';
      this.messages.push({ from: 'bot', text: reply, time: this.now() });
    });
  }

  useSuggestion(s: string) {
    this.input = s;
    this.send();
  }

  onEnter(e: any) {
    if (!e.shiftKey) {
      e.preventDefault();
      this.send();
    }
  }

  autoResize(e: any) {
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  }

  clearChat() {
    this.messages = [{ from: 'bot', text: 'Chat cleared! How can I assist you?', time: this.now() }];
    this.ragApi.clearHistory().pipe(catchError(() => of(null))).subscribe();
  }

  goBack() { this.location.back(); }

  private formatTime(value: string) {
    if (!value) return this.now();
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value.slice(0, 5);
    return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0');
  }
}
