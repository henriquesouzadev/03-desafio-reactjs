import { useState } from 'react';

import { FiCalendar, FiUser } from "react-icons/fi";
import Head from 'next/head';
import { GetStaticProps } from 'next';
import Link from 'next/link';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  
  // formatação dos posts
  const formattedPost = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(
          post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
      )
    };
  });

  const [posts, setPosts] = useState<Post[]>(formattedPost); 
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    // resultado de posts da próxima página
    const postResults = await fetch(`${nextPage}`).then(response => response.json());

    setNextPage(postResults.next_page);
    setCurrentPage(postResults.page);

    const newPosts = postResults.results.map((post: Post) => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(
            post.first_publication_date),
            'dd MMM yyy',
            { locale: ptBR }
        ),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        }
      };
    });

    setPosts([...posts, ...newPosts]);
  }; 

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>

      <Header />

      <main className={commonStyles.container}>
        <div className={styles.posts}>
          { posts.map((post: Post) => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{ post.data.title }</strong>
                <p>{ post.data.subtitle }</p>

                <div className={commonStyles.info}>
                  <div>
                    <FiCalendar className={commonStyles.icon} /> { post.first_publication_date }
                  </div>
                  <div>
                    <FiUser className={commonStyles.icon} /> { post.data.author }
                  </div>
                </div>
              </a>
            </Link>
          )) }
        </div>
        
        {nextPage && (
          <button
            type="button"
            className={styles.loadMore}
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        )}
        
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  // pega os posts do prismic e faz a paginação
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {pageSize: 1}
  );

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author
      }
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    },
    revalidate: 60 * 60 * 24
  };
};
