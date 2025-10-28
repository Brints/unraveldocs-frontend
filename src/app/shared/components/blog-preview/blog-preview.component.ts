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
      <div class="container">
        <div class="section-header">
          <h2>Latest from Our Blog</h2>
          <p>Stay updated with tips, tutorials, and insights about documentation</p>
        </div>

        <div class="blog-grid">
          @for (post of displayedPosts; track post.id) {
            <article class="blog-card" (click)="onPostClick(post.id)">
              <div class="blog-image">
                <img [src]="post.imageUrl" [alt]="post.title" loading="lazy">
                <div class="blog-category">{{ post.category }}</div>
              </div>
              <div class="blog-content">
                <h3>{{ post.title }}</h3>
                <p class="blog-excerpt">{{ post.excerpt }}</p>
                <div class="blog-meta">
                  <span class="author">{{ post.author }}</span>
                  <span class="date">{{ post.publishDate | date:'MMM dd, yyyy' }}</span>
                  <span class="read-time">{{ post.readTime }}</span>
                </div>
              </div>
            </article>
          }
        </div>

        <div class="blog-actions">
          <button class="btn btn-outline" (click)="onViewAllClick()">
            View All Posts
          </button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .blog-preview-section {
      padding: 4rem 0;
    }
    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }
    .section-header h2 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .section-header p {
      font-size: 1.2rem;
      color: #666;
    }
    .blog-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    .blog-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
    }
    .blog-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    }
    .blog-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }
    .blog-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .blog-category {
      position: absolute;
      top: 1rem;
      left: 1rem;
      background: #007bff;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .blog-content {
      padding: 1.5rem;
    }
    .blog-content h3 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
      line-height: 1.4;
    }
    .blog-excerpt {
      color: #666;
      margin-bottom: 1rem;
      line-height: 1.6;
    }
    .blog-meta {
      display: flex;
      gap: 1rem;
      font-size: 0.9rem;
      color: #888;
    }
    .blog-actions {
      text-align: center;
    }
    .btn {
      padding: 1rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      border: 2px solid #007bff;
      background: transparent;
      color: #007bff;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn:hover {
      background: #007bff;
      color: white;
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
