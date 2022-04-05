import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Head from 'next/head';
import { FiUser, FiCalendar, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

import Header from '../../components/Header';

interface Post {
   first_publication_date: string | null;
   data: {
      title: string;
      banner: {
         url: string;
      };
      author: string;
      content: {
         heading: string;
         body: {
            text: string;
         }[];
      }[];
   };
}

interface PostProps {
   post: Post;
}

export default function Post({ post }: PostProps) {
   const router = useRouter();

   if (router.isFallback) {
      return (
         <>
            <Head>
               <title>Posts | spacetraveling</title>
            </Head>

            <Header />

            <div className={commonStyles.container}>
               <div className={styles.post}>
                  <main className={styles.container}>
                     <strong className={styles.title}>Carregando...</strong>
                  </main>
               </div>
            </div>
         </>
      );
   }
   
   const totalMinutes = post.data.content.reduce((acc, content) => {
      const contentHeading = content.heading.split(" ").length;
      const contentBody = RichText.asText(content.body).split(" ").length;
      const totalWords = contentBody + contentHeading
      const result = Math.ceil(totalWords / 200)

      return acc + result
   }, 0);

   return (
      <>
         <Head>
            <title>Posts | spacetraveling</title>
         </Head>

         <Header />

         <div className={styles.post}>
            <section className={styles.banner}>
               <img src={post?.data?.banner.url} alt="banner" />
            </section>

            <main className={commonStyles.container}>
               <div className={styles.content}>
                  <strong className={styles.title}>
                     {post?.data?.title || 'title'}
                  </strong>

                  <div className={commonStyles.info}>
                     <div>
                        <FiCalendar className={commonStyles.icon} />
                        <time>
                           {format(
                              new Date(post.first_publication_date),
                              'dd MMM yyyy',
                              { locale: ptBR }
                           )}
                        </time>
                     </div>

                     <div>
                        <FiUser className={commonStyles.icon} /> {post.data.author}
                     </div>

                     <div>
                        <FiClock className={commonStyles.icon} /> <time>{totalMinutes} min</time>
                     </div>
                  </div> {/* info */}

                  <div className={styles.article}>
                     {post.data.content.map((content, index) => {
                        return (
                           <article key={`content-${index}`} className={styles.article}>
                              <h2 className={styles.heading}>{content.heading}</h2>
                              <section
                                 dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body.map(item => item)) }}
                                 className={styles.content}
                              />
                           </article>
                        );
                     })}
                  </div>
               </div>
            </main>
         </div>
      </>
   );
}

export const getStaticPaths: GetStaticPaths = async () => {
   const prismic = getPrismicClient();
   const posts = await prismic.query(
      [Prismic.predicates.at('document.type', 'posts')]
   );

   const paths = posts.results.map(post => {
      return {
         params: { slug: post.uid }
      }
   });

   return {
      paths,
      fallback: true,
   };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
   const prismic = getPrismicClient();
   const response = await prismic.getByUID('posts', String(params.slug), {});

   return {
      props: { post: response },
      revalidate: 60 * 5,
   };
};
