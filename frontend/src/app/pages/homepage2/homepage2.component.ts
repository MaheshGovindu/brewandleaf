import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Product, Category, SubCategory, Banner } from '../../models/brew-and-leaf.models';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-homepage2',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './homepage2.component.html',
  styleUrls: ['./homepage2.component.scss']
})
export class Homepage2Component implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroImage') heroImage!: ElementRef;
  
  products: Product[] = [];
  categories: Category[] = [];
  subCategories: SubCategory[] = [];
  featuredProducts: Product[] = [];
  menuGroups: any[] = [];
  gallery: any[] = [];
  settings: any = {};
  testimonials: any[] = [];
  
  team = [
    { name: 'Dominic Morgan', role: 'HEAD OF COFFEE', image: 'assets/img/model-Frame.svg' },
    { name: 'Selena J. Gomez', role: 'BARISTA', image: 'assets/img/model-frame2.svg' },
    { name: 'Martin Gurey', role: 'GENERAL MANAGER', image: 'assets/img/model-Frame.svg' }
  ];

  faqs = [
    { question: 'What is your coffee bean origin?', answer: 'We source our beans from organic farms in Ethiopia, Colombia, and Brazil.', active: false },
    { question: 'Do you offer vegan milk options?', answer: 'Yes, we have Oat, Almond, and Soy milk available.', active: false },
    { question: 'Do you have free Wi-Fi?', answer: 'Yes, high-speed Wi-Fi is available for all our customers.', active: false },
    { question: 'Can I book a private event?', answer: 'Absolutely! Contact us via the form below for event bookings.', active: false }
  ];

  constructor(public apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initAnimations();
  }

  loadData(): void {
    this.apiService.getCategories().subscribe(data => {
      this.categories = data;
      this.refreshScroll();
    });
    
    this.apiService.getTestimonials().subscribe(data => {
      this.testimonials = data;
      this.refreshScroll();
    });
    
    this.apiService.getGallery().subscribe(data => {
      this.gallery = data;
      this.refreshScroll();
    });
    
    this.apiService.getSettings().subscribe(data => {
      this.settings = data;
      this.refreshScroll();
    });
    
    this.apiService.getSubCategories().subscribe(subCategories => {
      this.subCategories = subCategories;
      
      this.apiService.getProducts().subscribe(products => {
        this.products = products;
        this.featuredProducts = products.filter(p => p.is_featured).slice(0, 4);
        
        // Group products by sub-category for the menu highlight
        this.menuGroups = this.subCategories.map(sub => ({
          name: sub.name,
          products: this.products.filter(p => p.sub_category_id === sub.id).slice(0, 5)
        })).filter(group => group.products.length > 0);
        
        this.refreshScroll();
      });
    });
  }

  private refreshScroll(): void {
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
  }

  initAnimations(): void {
    // Hero Section Animations
    gsap.from('.hero-content h1', {
      y: 100,
      opacity: 0,
      duration: 1.2,
      ease: 'power4.out'
    });

    // Hero Cup Scroll Animation (Up to Down, Big to Small)
    gsap.to('.hero-image', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      },
      y: 300,
      scale: 0.5,
      rotate: 15,
      ease: 'none'
    });

    // Floating animation for hero image (subtle)
    gsap.to('.hero-image', {
      y: '+=15',
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });

    // Background Title Parallax
    gsap.to('.hero-section::before', {
      scrollTrigger: {
        trigger: '.hero-section',
        start: 'top top',
        end: 'bottom top',
        scrub: 2
      },
      y: -200,
      opacity: 0.1
    });

    // Scroll Animations for sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
      const elements = section.querySelectorAll('.animate-on-scroll');
      if (elements.length > 0) {
        // Force opacity 0 before animation starts via GSAP set
        gsap.set(elements, { opacity: 0, y: 40 });
        
        gsap.to(elements, {
          scrollTrigger: {
            trigger: section,
            start: 'top 85%',
            toggleActions: 'play none none none'
          },
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out'
        });
      }
    });

    // Moments Carousel Auto-scroll
    const track = document.querySelector('.carousel-track');
    if (track) {
      gsap.to(track, {
        x: '-50%',
        duration: 30,
        ease: 'none',
        repeat: -1
      });
    }

    // Navbar background change on scroll
    ScrollTrigger.create({
      start: 'top -80',
      onEnter: () => gsap.to('.navbar', { backgroundColor: 'rgba(255, 255, 255, 0.98)', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', duration: 0.4 }),
      onLeaveBack: () => gsap.to('.navbar', { backgroundColor: 'rgba(255, 255, 255, 1)', backdropFilter: 'none', boxShadow: 'none', duration: 0.4 })
    });
  }

  toggleFaq(index: number): void {
    this.faqs[index].active = !this.faqs[index].active;
  }

  ngOnDestroy(): void {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }
}
