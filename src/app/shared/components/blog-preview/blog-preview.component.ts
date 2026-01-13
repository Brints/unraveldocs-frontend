import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishDate: Date;
  readTime: string;
  category: string;
  imageUrl: string;
}

@Component({
  selector: 'app-blog-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="blog-preview-section">
      <div class="blog-container">
        <div class="section-header">
          <span class="section-label">Our Blog</span>
          <h2>Latest Insights & Updates</h2>
          <p>Stay informed with tips, tutorials, and best practices for document management</p>
        </div>

        <div class="blog-grid">
          @for (post of displayedPosts; track post.id) {
            <article class="blog-card" (click)="onPostClick(post.id)">
              <div class="blog-image">
                <img [src]="post.imageUrl" [alt]="post.title" loading="lazy">
                <span class="blog-category">{{ post.category }}</span>
              </div>
              <div class="blog-content">
                <h3>{{ post.title }}</h3>
                <p class="blog-excerpt">{{ post.excerpt }}</p>
                <div class="blog-footer">
                  <div class="blog-author">
                    <div class="author-avatar">{{ post.author.charAt(0) }}</div>
                    <span class="author-name">{{ post.author }}</span>
                  </div>
                  <div class="blog-meta">
                    <span class="date">{{ post.publishDate | date:'MMM dd' }}</span>
                    <span class="separator">•</span>
                    <span class="read-time">{{ post.readTime }}</span>
                  </div>
                </div>
              </div>
            </article>
          }
        </div>

        <div class="blog-actions">
          <button class="view-all-btn" (click)="onViewAllClick()">
            View All Posts
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .blog-preview-section {
      padding: 5rem 1.5rem;
      background: #f8fafc;
    }

    .blog-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .section-header {
      text-align: center;
      margin-bottom: 3.5rem;
    }

    .section-label {
      display: inline-block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #4f46e5;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
    }

    .section-header h2 {
      font-size: 2.25rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 1rem;
      line-height: 1.2;
    }

    .section-header p {
      font-size: 1.125rem;
      color: #6b7280;
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .blog-card {
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .blog-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }

    .blog-image {
      position: relative;
      aspect-ratio: 16 / 9;
      overflow: hidden;
    }

    .blog-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    .blog-card:hover .blog-image img {
      transform: scale(1.05);
    }

    .blog-category {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: #4f46e5;
      color: white;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
    }

    .blog-content {
      padding: 1.5rem;
    }

    .blog-content h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #111827;
      margin: 0 0 0.75rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .blog-excerpt {
      font-size: 0.9375rem;
      color: #6b7280;
      line-height: 1.6;
      margin: 0 0 1.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .blog-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    .blog-author {
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .author-avatar {
      width: 2rem;
      height: 2rem;
      background: #e0e7ff;
      color: #4f46e5;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .author-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .blog-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #9ca3af;
    }

    .separator {
      color: #d1d5db;
    }

    .blog-actions {
      text-align: center;
    }

    .view-all-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.75rem;
      background: white;
      color: #4f46e5;
      border: 2px solid #4f46e5;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-all-btn:hover {
      background: #4f46e5;
      color: white;
    }

    .view-all-btn svg {
      transition: transform 0.2s ease;
    }

    .view-all-btn:hover svg {
      transform: translateX(4px);
    }

    @media (max-width: 768px) {
      .blog-preview-section {
        padding: 3rem 1rem;
      }

      .section-header h2 {
        font-size: 1.75rem;
      }

      .blog-grid {
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
    }
  `]
})
export class BlogPreviewComponent {
  @Input() maxPosts = 3;
  @Output() postClicked = new EventEmitter<string>();
  @Output() viewAllClicked = new EventEmitter<void>();

  private allPosts: BlogPost[] = [
    {
      id: '1',
      title: '5 Best Practices for Technical Documentation',
      excerpt: 'Learn how to create clear, comprehensive technical documentation that your team will actually use.',
      author: 'Sarah Johnson',
      publishDate: new Date('2024-03-15'),
      readTime: '5 min read',
      category: 'Best Practices',
      imageUrl: '/assets/images/blog/tech-docs.jpg'
    },
    {
      id: '2',
      title: 'Collaborative Writing: Tools and Techniques',
      excerpt: 'Discover the latest tools and methods for effective collaborative writing in distributed teams.',
      author: 'Mike Chen',
      publishDate: new Date('2024-03-10'),
      readTime: '7 min read',
      category: 'Collaboration',
      imageUrl: '/assets/images/blog/collaboration.jpg'
    },
    {
      id: '3',
      title: 'Version Control for Documentation',
      excerpt: 'Master version control strategies specifically designed for documentation workflows.',
      author: 'Emily Davis',
      publishDate: new Date('2024-03-05'),
      readTime: '6 min read',
      category: 'Version Control',
      imageUrl: '/assets/images/blog/version-control.jpg'
    },
    {
      id: '4',
      title: 'Creating Interactive Documentation',
      excerpt: 'Transform static docs into interactive experiences that engage your audience.',
      author: 'Alex Rodriguez',
      publishDate: new Date('2024-02-28'),
      readTime: '8 min read',
      category: 'Interactive',
      imageUrl: '/assets/images/blog/interactive.jpg'
    }
  ];

  get displayedPosts(): BlogPost[] {
    return this.allPosts.slice(0, this.maxPosts);
  }

  onPostClick(postId: string): void {
    this.postClicked.emit(postId);
  }

  onViewAllClick(): void {
    this.viewAllClicked.emit();
  }
}
